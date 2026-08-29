'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { RuntimeValidationError, validateRuntime } = require('../runtime/validate-runtime.js');

const VALIDATION_ARGUMENT = '--validation-auto-close-ms=';
const MAX_VALIDATION_AUTO_CLOSE_MS = 60_000;

function parseValidationAutoCloseMs(args) {
  if (args.length === 0) return null;
  if (args.length !== 1 || !args[0].startsWith(VALIDATION_ARGUMENT)) {
    throw new Error(`不支援的啟動參數：${args.join(' ')}`);
  }
  const value = Number(args[0].slice(VALIDATION_ARGUMENT.length));
  if (!Number.isInteger(value) || value < 1 || value > MAX_VALIDATION_AUTO_CLOSE_MS) {
    throw new Error(`驗證自動關閉時間必須是 1 到 ${MAX_VALIDATION_AUTO_CLOSE_MS} 毫秒的整數。`);
  }
  return value;
}

function printRuntimeInfo(runtime) {
  console.log(`[檢查] JanusScope ${runtime.janusScopeVersion}`);
  console.log(`[檢查] Node.js ${runtime.nodeVersion}（repo-local）`);
  console.log(`[檢查] Playwright ${runtime.playwrightVersion}（local dependency）`);
  console.log(`[檢查] Chromium revision ${runtime.chromiumRevision}`);
  console.log(`[檢查] Chromium executable：${runtime.chromiumExecutable}`);
}

async function launchDesktop(options = {}) {
  const autoCloseMs = options.autoCloseMs ?? null;
  const runtime = validateRuntime(options.runtimeOptions);
  printRuntimeInfo(runtime);

  const profilePath = path.join(runtime.repoRoot, 'profile', 'desktop');
  try {
    fs.mkdirSync(profilePath, { recursive: true });
  } catch (error) {
    throw new Error(`無法建立 repo-local Desktop profile：${profilePath}（${error.message}）`);
  }

  console.log('[模式] Desktop');
  console.log('[啟動] 正在啟動 Playwright-managed headed Chromium...');

  let context;
  let contextClosePromise;
  let autoCloseTimer;
  let contextClosed = false;
  const closeForSignal = () => {
    if (context && !contextClosed) void context.close().catch(() => {});
  };

  try {
    context = await runtime.chromium.launchPersistentContext(profilePath, {
      headless: false,
    });
    contextClosePromise = context.waitForEvent('close');
    context.once('close', () => {
      contextClosed = true;
    });
    process.once('SIGINT', closeForSignal);
    process.once('SIGTERM', closeForSignal);

    const pages = context.pages();
    const page = pages[0] || await context.newPage();
    if (page.url() !== 'about:blank') await page.goto('about:blank');

    const chromiumVersion = context.browser().version();
    console.log(`[通過] Chromium ${chromiumVersion} 已以 headed Desktop 模式啟動。`);
    console.log('[提示] 請在 Chromium 網址列輸入網址；關閉最後一個 JanusScope Chromium 視窗後程式會結束。');

    if (autoCloseMs !== null) {
      console.log(`[驗證] ${autoCloseMs} 毫秒後自動關閉 Desktop Chromium。`);
      autoCloseTimer = setTimeout(() => {
        if (!contextClosed) void context.close().catch(() => {});
      }, autoCloseMs);
    }

    await contextClosePromise;
    console.log('[完成] Desktop Chromium 已關閉，JanusScope process 正常結束。');

    return {
      ...runtime,
      chromiumVersion,
      profilePath,
    };
  } finally {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    process.removeListener('SIGINT', closeForSignal);
    process.removeListener('SIGTERM', closeForSignal);
    if (context && !contextClosed) await context.close().catch(() => {});
  }
}

async function main() {
  const autoCloseMs = parseValidationAutoCloseMs(process.argv.slice(2));
  await launchDesktop({ autoCloseMs });
}

if (require.main === module) {
  main().catch((error) => {
    const category = error instanceof RuntimeValidationError ? 'runtime 檢查' : 'Desktop 啟動';
    console.error(`[錯誤] JanusScope ${category}失敗：${error.message}`);
    console.error('[提示] 請先執行 setup.bat 修復 repo-local runtime；若遭資安政策阻擋，請交由管理單位確認，不要繞過安全機制。');
    process.exitCode = 1;
  });
}

module.exports = {
  launchDesktop,
  parseValidationAutoCloseMs,
  printRuntimeInfo,
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateRuntime } = require('../runtime/validate-runtime.js');
const { startScreenshotConsole } = require('../screenshot/screenshot-console.js');

const AUTO_CLOSE_ARGUMENT = '--validation-auto-close-ms=';
const CLIENT_PROFILE_ARGUMENT = '--validation-client-profile';
const MAX_VALIDATION_AUTO_CLOSE_MS = 60_000;
const CLIENT_PROFILE_DOCUMENT = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>JanusScope client profile validation</title></head><body></body></html>';

function parseValidationOptions(args) {
  let autoCloseMs = null;
  let probeClientProfile = false;

  for (const argument of args) {
    if (argument.startsWith(AUTO_CLOSE_ARGUMENT)) {
      if (autoCloseMs !== null) throw new Error('驗證自動關閉參數不得重複。');
      const value = Number(argument.slice(AUTO_CLOSE_ARGUMENT.length));
      if (!Number.isInteger(value) || value < 1 || value > MAX_VALIDATION_AUTO_CLOSE_MS) {
        throw new Error(`驗證自動關閉時間必須是 1 到 ${MAX_VALIDATION_AUTO_CLOSE_MS} 毫秒的整數。`);
      }
      autoCloseMs = value;
    } else if (argument === CLIENT_PROFILE_ARGUMENT) {
      if (probeClientProfile) throw new Error('Client profile 驗證參數不得重複。');
      probeClientProfile = true;
    } else {
      throw new Error(`不支援的啟動參數：${argument}`);
    }
  }

  return { autoCloseMs, probeClientProfile };
}

function printRuntimeInfo(runtime) {
  console.log(`[檢查] JanusScope ${runtime.janusScopeVersion}`);
  console.log(`[檢查] Node.js ${runtime.nodeVersion}（repo-local）`);
  console.log(`[檢查] Playwright ${runtime.playwrightVersion}（local dependency）`);
  console.log(`[檢查] Chromium revision ${runtime.chromiumRevision}`);
  console.log(`[檢查] Chromium executable：${runtime.chromiumExecutable}`);
}

async function readClientProfile(page) {
  return page.evaluate(() => ({
    userAgent: navigator.userAgent,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    maxTouchPoints: navigator.maxTouchPoints,
  }));
}

function printClientProfile(mode, profilePath, clientProfile) {
  const evidence = {
    mode,
    profilePath,
    ...clientProfile,
  };
  console.log(`[驗證] Client profile：${JSON.stringify(evidence)}`);
  console.log(`CLIENT_PROFILE_JSON=${JSON.stringify(evidence)}`);
}

async function launchPersistentSession(options) {
  const {
    mode,
    label,
    profileDirectory,
    contextOptions,
    descriptorName = null,
    runtime: providedRuntime,
    runtimeOptions,
    autoCloseMs = null,
    probeClientProfile = false,
    enableScreenshotConsole = true,
    sessionTask = null,
  } = options;

  const runtime = providedRuntime || validateRuntime(runtimeOptions);
  printRuntimeInfo(runtime);

  const profilePath = path.join(runtime.repoRoot, 'profile', profileDirectory);
  try {
    fs.mkdirSync(profilePath, { recursive: true });
  } catch (error) {
    throw new Error(`無法建立 repo-local ${label} profile：${profilePath}（${error.message}）`);
  }

  console.log(`[模式] ${label}`);
  console.log(`[設定] Profile：${profilePath}`);
  if (descriptorName) console.log(`[設定] Playwright device descriptor：${descriptorName}`);
  console.log('[啟動] 正在啟動 Playwright-managed headed Chromium...');

  let context;
  let contextClosePromise;
  let autoCloseTimer;
  let screenshotConsole;
  let contextClosed = false;
  const closeForSignal = () => {
    if (context && !contextClosed) void context.close().catch(() => {});
  };

  try {
    context = await runtime.chromium.launchPersistentContext(profilePath, {
      ...contextOptions,
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
    if (probeClientProfile) await page.setContent(CLIENT_PROFILE_DOCUMENT);

    const chromiumVersion = context.browser().version();
    const clientProfile = probeClientProfile ? await readClientProfile(page) : null;
    console.log(`[通過] Chromium ${chromiumVersion} 已以 headed ${label} 模式啟動。`);
    if (clientProfile) printClientProfile(mode, profilePath, clientProfile);
    console.log('[提示] 請在 Chromium 網址列輸入網址；關閉最後一個 JanusScope Chromium 視窗後程式會結束。');
    if (enableScreenshotConsole) {
      screenshotConsole = startScreenshotConsole({ context, mode, repoRoot: runtime.repoRoot });
    }
    if (sessionTask) await sessionTask({ context, page, mode, repoRoot: runtime.repoRoot });

    if (autoCloseMs !== null) {
      console.log(`[驗證] ${autoCloseMs} 毫秒後自動關閉 Chromium。`);
      autoCloseTimer = setTimeout(() => {
        if (!contextClosed) void context.close().catch(() => {});
      }, autoCloseMs);
    }

    await contextClosePromise;
    if (screenshotConsole) await screenshotConsole.stop();
    console.log(`[完成] ${label} Chromium 已關閉，JanusScope process 正常結束。`);

    return {
      ...runtime,
      chromiumVersion,
      clientProfile,
      descriptorName,
      label,
      mode,
      profilePath,
    };
  } finally {
    if (screenshotConsole) await screenshotConsole.stop();
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    process.removeListener('SIGINT', closeForSignal);
    process.removeListener('SIGTERM', closeForSignal);
    if (context && !contextClosed) await context.close().catch(() => {});
  }
}

module.exports = {
  launchPersistentSession,
  parseValidationOptions,
  printClientProfile,
  printRuntimeInfo,
  readClientProfile,
};

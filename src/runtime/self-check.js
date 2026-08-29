'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const runtimeRoot = path.join(repoRoot, 'runtime');
const expectedNode = path.join(runtimeRoot, 'node', 'node.exe');
const expectedBrowserRoot = path.join(runtimeRoot, 'browsers');
const config = loadRuntimeConfig(path.join(repoRoot, 'config', 'runtime-versions.cmd'));
const filesOnly = process.argv.includes('--files-only');

function loadRuntimeConfig(configPath) {
  const entries = {};
  for (const line of fs.readFileSync(configPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^set "([A-Z0-9_]+)=(.*)"$/i);
    if (match) entries[match[1]] = match[2];
  }
  if (!entries.NODE_VERSION || !entries.PLAYWRIGHT_VERSION) {
    throw new Error(`runtime 版本設定不完整：${configPath}`);
  }
  return {
    node: { version: entries.NODE_VERSION },
    playwright: { version: entries.PLAYWRIGHT_VERSION },
  };
}

function sameWindowsPath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function assertInside(child, parent, label) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} 不在 JanusScope runtime 資料夾內：${child}`);
  }
}

async function main() {
  if (process.platform !== 'win32') {
    throw new Error('runtime self-check 僅支援 Windows x64。');
  }
  if (!sameWindowsPath(process.execPath, expectedNode)) {
    throw new Error(`目前不是使用 JanusScope 專用 Node.js：${process.execPath}`);
  }
  if (process.version !== `v${config.node.version}`) {
    throw new Error(`Node.js 版本不符：預期 v${config.node.version}，實際 ${process.version}`);
  }

  const playwrightPackage = require(path.join(repoRoot, 'node_modules', 'playwright', 'package.json'));
  if (playwrightPackage.version !== config.playwright.version) {
    throw new Error(`Playwright 版本不符：預期 ${config.playwright.version}，實際 ${playwrightPackage.version}`);
  }

  const configuredBrowserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!configuredBrowserRoot || !sameWindowsPath(configuredBrowserRoot, expectedBrowserRoot)) {
    throw new Error(`PLAYWRIGHT_BROWSERS_PATH 必須指向 ${expectedBrowserRoot}`);
  }

  const { chromium } = require('playwright');
  const executable = chromium.executablePath();
  assertInside(executable, expectedBrowserRoot, 'Chromium executable');
  if (!fs.existsSync(executable)) {
    throw new Error(`找不到 Playwright-managed Chromium：${executable}`);
  }

  let chromiumVersion = '尚未啟動（files-only）';
  if (!filesOnly) {
    const browser = await chromium.launch({ headless: true });
    try {
      chromiumVersion = browser.version();
    } finally {
      await browser.close();
    }
  }

  console.log(`[通過] Node.js ${process.version}（repo-local）`);
  console.log(`[通過] Playwright ${playwrightPackage.version}（local dependency）`);
  console.log(`[通過] Chromium ${chromiumVersion}（${executable}）`);
}

main().catch((error) => {
  console.error(`[錯誤] JanusScope runtime self-check 失敗：${error.message}`);
  process.exitCode = 1;
});

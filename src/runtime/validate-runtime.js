'use strict';

const fs = require('node:fs');
const path = require('node:path');

class RuntimeValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RuntimeValidationError';
  }
}

function sameWindowsPath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function assertInside(child, parent, label) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RuntimeValidationError(`${label} 不在 JanusScope runtime 資料夾內：${child}`);
  }
}

function loadRuntimeConfig(configPath) {
  let source;
  try {
    source = fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    throw new RuntimeValidationError(`找不到或無法讀取 runtime 版本設定：${configPath}（${error.message}）`);
  }

  const entries = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^set "([A-Z0-9_]+)=(.*)"$/i);
    if (match) entries[match[1]] = match[2];
  }
  if (!entries.NODE_VERSION || !entries.PLAYWRIGHT_VERSION || entries.PLAYWRIGHT_BROWSER !== 'chromium') {
    throw new RuntimeValidationError(`runtime 版本設定不完整或 browser contract 不符：${configPath}`);
  }
  return entries;
}

function loadJson(jsonPath, label) {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    throw new RuntimeValidationError(`${label} 缺少、損壞或無法讀取：${jsonPath}（${error.message}）`);
  }
}

function extractChromiumRevision(executable, browserRoot) {
  assertInside(executable, browserRoot, 'Chromium executable');
  const relative = path.relative(browserRoot, executable);
  const match = relative.match(/(?:^|[\\/])chromium-(\d+)(?:[\\/]|$)/i);
  return match ? match[1] : '無法從路徑判定';
}

function validateRuntime(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..', '..'));
  const runtimeRoot = path.join(repoRoot, 'runtime');
  const expectedNode = path.join(runtimeRoot, 'node', 'node.exe');
  const expectedBrowserRoot = path.join(runtimeRoot, 'browsers');
  const execPath = options.execPath || process.execPath;
  const platform = options.platform || process.platform;
  const environment = options.environment || process.env;

  if (platform !== 'win32') {
    throw new RuntimeValidationError('Desktop 啟動目前僅支援 Windows x64。');
  }
  if (!fs.existsSync(expectedNode)) {
    throw new RuntimeValidationError(`找不到 repo-local Node.js：${expectedNode}`);
  }
  if (!sameWindowsPath(execPath, expectedNode)) {
    throw new RuntimeValidationError(`目前不是使用 JanusScope 專用 Node.js：${execPath}`);
  }

  const config = loadRuntimeConfig(path.join(repoRoot, 'config', 'runtime-versions.cmd'));
  if (process.version !== `v${config.NODE_VERSION}`) {
    throw new RuntimeValidationError(`Node.js 版本不符：預期 v${config.NODE_VERSION}，實際 ${process.version}`);
  }

  const janusPackage = loadJson(path.join(repoRoot, 'package.json'), 'JanusScope package metadata');
  const playwrightPackagePath = path.join(repoRoot, 'node_modules', 'playwright', 'package.json');
  const playwrightPackage = loadJson(playwrightPackagePath, 'Playwright local dependency');
  if (playwrightPackage.version !== config.PLAYWRIGHT_VERSION) {
    throw new RuntimeValidationError(`Playwright 版本不符：預期 ${config.PLAYWRIGHT_VERSION}，實際 ${playwrightPackage.version}`);
  }

  const configuredBrowserRoot = environment.PLAYWRIGHT_BROWSERS_PATH;
  if (!configuredBrowserRoot || !sameWindowsPath(configuredBrowserRoot, expectedBrowserRoot)) {
    throw new RuntimeValidationError(`PLAYWRIGHT_BROWSERS_PATH 必須指向 ${expectedBrowserRoot}`);
  }

  let chromium;
  try {
    ({ chromium } = require(path.join(repoRoot, 'node_modules', 'playwright')));
  } catch (error) {
    throw new RuntimeValidationError(`Playwright local dependency 無法載入（${error.message}）`);
  }

  const executable = chromium.executablePath();
  assertInside(executable, expectedBrowserRoot, 'Chromium executable');
  if (!fs.existsSync(executable)) {
    throw new RuntimeValidationError(`找不到 Playwright-managed Chromium：${executable}`);
  }

  return {
    repoRoot,
    runtimeRoot,
    browserRoot: expectedBrowserRoot,
    chromium,
    chromiumExecutable: executable,
    chromiumRevision: extractChromiumRevision(executable, expectedBrowserRoot),
    janusScopeVersion: janusPackage.version,
    nodeVersion: process.version,
    playwrightVersion: playwrightPackage.version,
  };
}

module.exports = {
  RuntimeValidationError,
  assertInside,
  extractChromiumRevision,
  loadRuntimeConfig,
  sameWindowsPath,
  validateRuntime,
};

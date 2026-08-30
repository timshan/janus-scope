'use strict';

const { RuntimeValidationError } = require('../runtime/validate-runtime.js');
const { launchPersistentSession, parseValidationOptions } = require('./browser-session.js');

function parseValidationAutoCloseMs(args) {
  return parseValidationOptions(args).autoCloseMs;
}

async function launchDesktop(options = {}) {
  return launchPersistentSession({
    mode: 'desktop',
    label: 'Desktop',
    profileDirectory: 'desktop',
    contextOptions: {},
    runtimeOptions: options.runtimeOptions,
    autoCloseMs: options.autoCloseMs ?? null,
    probeClientProfile: options.probeClientProfile ?? false,
    enableScreenshotConsole: options.enableScreenshotConsole ?? true,
    sessionTask: options.sessionTask ?? null,
  });
}

async function main() {
  const validation = parseValidationOptions(process.argv.slice(2));
  await launchDesktop(validation);
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
};

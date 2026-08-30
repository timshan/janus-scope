'use strict';

const { getAndroidMobileProfile } = require('../profiles/android-mobile.js');
const { RuntimeValidationError, validateRuntime } = require('../runtime/validate-runtime.js');
const { launchPersistentSession, parseValidationOptions } = require('./browser-session.js');

async function launchAndroidMobile(options = {}) {
  const runtime = validateRuntime(options.runtimeOptions);
  const profile = getAndroidMobileProfile(runtime.devices);

  return launchPersistentSession({
    runtime,
    mode: profile.mode,
    label: profile.label,
    profileDirectory: profile.profileDirectory,
    descriptorName: profile.descriptorName,
    contextOptions: profile.contextOptions,
    autoCloseMs: options.autoCloseMs ?? null,
    probeClientProfile: options.probeClientProfile ?? false,
  });
}

async function main() {
  const validation = parseValidationOptions(process.argv.slice(2));
  await launchAndroidMobile(validation);
}

if (require.main === module) {
  main().catch((error) => {
    const category = error instanceof RuntimeValidationError ? 'runtime 檢查' : 'Android 手機啟動';
    console.error(`[錯誤] JanusScope ${category}失敗：${error.message}`);
    console.error('[提示] 請先執行 setup.bat 修復 repo-local runtime；若遭資安政策阻擋，請交由管理單位確認，不要繞過安全機制。');
    process.exitCode = 1;
  });
}

module.exports = {
  launchAndroidMobile,
};

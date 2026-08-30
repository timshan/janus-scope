'use strict';

const { launchAndroidMobile } = require('../launcher/android-mobile.js');
const { launchDesktop } = require('../launcher/desktop.js');

const VALIDATION_AUTO_CLOSE_MS = 1500;

function assertProfileDifferences(desktop, mobile) {
  if (!desktop || !mobile) throw new Error('Desktop 或 Android Mobile client profile probe 缺少結果。');
  if (desktop.userAgent === mobile.userAgent) throw new Error('Desktop 與 Android Mobile User-Agent 不得相同。');
  if (!mobile.userAgent.includes('Android') || !mobile.userAgent.includes('Mobile')) {
    throw new Error('Android Mobile User-Agent 未呈現 Android Chrome Mobile identity。');
  }
  if (mobile.innerWidth !== 412 || Math.abs(mobile.innerHeight - 839) > 1) {
    throw new Error(`Android Mobile viewport 不符 Pixel 7 descriptor：${mobile.innerWidth}x${mobile.innerHeight}`);
  }
  if (Math.abs(mobile.devicePixelRatio - 2.625) > 0.001) {
    throw new Error(`Android Mobile devicePixelRatio 不符 Pixel 7 descriptor：${mobile.devicePixelRatio}`);
  }
  if (mobile.maxTouchPoints < 1) throw new Error('Android Mobile touch capability 未生效。');
  if (desktop.innerWidth === mobile.innerWidth && desktop.innerHeight === mobile.innerHeight) {
    throw new Error('Desktop 與 Android Mobile viewport 不得相同。');
  }
  if (desktop.maxTouchPoints === mobile.maxTouchPoints) {
    throw new Error('Desktop 與 Android Mobile maxTouchPoints 不得相同。');
  }
}

async function validateClientProfiles() {
  console.log('[驗證] 啟動 Desktop client profile probe...');
  const desktopResult = await launchDesktop({
    autoCloseMs: VALIDATION_AUTO_CLOSE_MS,
    probeClientProfile: true,
  });

  console.log('[驗證] 啟動 Android Mobile client profile probe...');
  const mobileResult = await launchAndroidMobile({
    autoCloseMs: VALIDATION_AUTO_CLOSE_MS,
    probeClientProfile: true,
  });

  if (desktopResult.profilePath.toLowerCase() === mobileResult.profilePath.toLowerCase()) {
    throw new Error('Desktop 與 Android Mobile 不得共用 persistent profile path。');
  }

  assertProfileDifferences(desktopResult.clientProfile, mobileResult.clientProfile);
  console.log(`DESKTOP_PROFILE_PATH=${desktopResult.profilePath}`);
  console.log(`MOBILE_PROFILE_PATH=${mobileResult.profilePath}`);
  console.log('CLIENT_PROFILE_DIFFERENCE_PASS');

  return { desktopResult, mobileResult };
}

if (require.main === module) {
  validateClientProfiles().catch((error) => {
    console.error(`[錯誤] Desktop／Android Mobile client profile 驗證失敗：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  assertProfileDifferences,
  validateClientProfiles,
};

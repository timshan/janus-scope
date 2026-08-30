'use strict';

const DEVICE_DESCRIPTOR_NAME = 'Pixel 7';

function positiveDimension(value) {
  return Number.isInteger(value) && value > 0;
}

function getAndroidMobileProfile(devices) {
  const descriptor = devices && devices[DEVICE_DESCRIPTOR_NAME];
  if (!descriptor) {
    throw new Error(`目前固定的 Playwright 找不到官方 ${DEVICE_DESCRIPTOR_NAME} device descriptor。`);
  }
  if (descriptor.defaultBrowserType !== 'chromium') {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 必須使用 Chromium。`);
  }
  if (typeof descriptor.userAgent !== 'string' || !descriptor.userAgent.includes('Android') || descriptor.userAgent.includes('iPhone')) {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 不是 Android/Chrome-style User-Agent。`);
  }
  if (!descriptor.viewport || !positiveDimension(descriptor.viewport.width) || !positiveDimension(descriptor.viewport.height)) {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 缺少有效 mobile viewport。`);
  }
  if (!descriptor.screen || !positiveDimension(descriptor.screen.width) || !positiveDimension(descriptor.screen.height)) {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 缺少有效 screen 設定。`);
  }
  if (!(descriptor.deviceScaleFactor > 0)) {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 缺少有效 deviceScaleFactor。`);
  }
  if (descriptor.isMobile !== true || descriptor.hasTouch !== true) {
    throw new Error(`官方 ${DEVICE_DESCRIPTOR_NAME} descriptor 必須啟用 mobile 與 touch 能力。`);
  }

  const { defaultBrowserType, ...contextOptions } = descriptor;
  return {
    descriptorName: DEVICE_DESCRIPTOR_NAME,
    label: 'Android 手機',
    mode: 'android-mobile',
    profileDirectory: 'android-mobile',
    contextOptions: {
      ...contextOptions,
      viewport: { ...contextOptions.viewport },
      screen: { ...contextOptions.screen },
    },
  };
}

module.exports = {
  DEVICE_DESCRIPTOR_NAME,
  getAndroidMobileProfile,
};

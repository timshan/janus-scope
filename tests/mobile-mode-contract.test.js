'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertCrlfBatch(relativePath) {
  const bytes = fs.readFileSync(path.join(repoRoot, relativePath));
  assert.equal(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, false, `${relativePath} 不得含 UTF-8 BOM`);
  const text = bytes.toString('utf8');
  assert.match(text, /\r\n/);
  assert.doesNotMatch(text.replaceAll('\r\n', ''), /[\r\n]/, `${relativePath} 必須只使用 CRLF`);
}

test('Android Mobile profile 固定使用官方 Pixel 7 Chromium descriptor', () => {
  const source = read('src/profiles/android-mobile.js');
  assert.match(source, /DEVICE_DESCRIPTOR_NAME\s*=\s*['"]Pixel 7['"]/);
  assert.match(source, /defaultBrowserType[\s\S]*chromium/);
  assert.match(source, /Android/);
  assert.match(source, /isMobile/);
  assert.match(source, /hasTouch/);
  assert.doesNotMatch(source, /DEVICE_DESCRIPTOR_NAME\s*=\s*['"]iPhone|Math\.random/i);
});

test('Android Mobile profile 會驗證並保留官方 descriptor 主要參數', () => {
  const { getAndroidMobileProfile } = require('../src/profiles/android-mobile.js');
  const descriptor = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/151.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 839 },
    screen: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  };
  const profile = getAndroidMobileProfile({ 'Pixel 7': descriptor });
  assert.equal(profile.descriptorName, 'Pixel 7');
  assert.equal(profile.profileDirectory, 'android-mobile');
  assert.deepEqual(profile.contextOptions.viewport, descriptor.viewport);
  assert.deepEqual(profile.contextOptions.screen, descriptor.screen);
  assert.equal(profile.contextOptions.deviceScaleFactor, 2.625);
  assert.equal(profile.contextOptions.isMobile, true);
  assert.equal(profile.contextOptions.hasTouch, true);
  assert.match(profile.contextOptions.userAgent, /Android 14/);
  assert.equal('defaultBrowserType' in profile.contextOptions, false);
  assert.throws(() => getAndroidMobileProfile({}), /Pixel 7/);
  assert.throws(() => getAndroidMobileProfile({ 'Pixel 7': { ...descriptor, defaultBrowserType: 'webkit' } }), /Chromium/);
  assert.throws(() => getAndroidMobileProfile({ 'Pixel 7': { ...descriptor, hasTouch: false } }), /touch/);
});

test('start selector 提供台灣華語模式選單且無效輸入不 fallback', () => {
  const source = read('src/launcher/start.js');
  assert.match(source, /請選擇瀏覽模式：/);
  assert.match(source, /\[1\] Desktop/);
  assert.match(source, /\[2\] Android 手機/);
  assert.match(source, /launchDesktop/);
  assert.match(source, /launchAndroidMobile/);
  assert.match(source, /無效的瀏覽模式/);

  const { parseStartArguments, normalizeModeSelection } = require('../src/launcher/start.js');
  assert.deepEqual(parseStartArguments(['desktop']), { mode: 'desktop', validationArgs: [] });
  assert.deepEqual(parseStartArguments(['mobile', '--validation-client-profile']), {
    mode: 'mobile',
    validationArgs: ['--validation-client-profile'],
  });
  assert.deepEqual(parseStartArguments(['--validation-auto-close-ms=1000']), {
    mode: null,
    validationArgs: ['--validation-auto-close-ms=1000'],
  });
  assert.equal(normalizeModeSelection('1'), 'desktop');
  assert.equal(normalizeModeSelection('2'), 'mobile');
  assert.throws(() => normalizeModeSelection('3'), /無效的瀏覽模式/);
  assert.throws(() => parseStartArguments(['tablet']), /無效的瀏覽模式/);
});

test('Mobile 與 Desktop 使用同一 runtime、headed Chromium 與不同 persistent profile', () => {
  const desktop = read('src/launcher/desktop.js');
  const mobile = read('src/launcher/android-mobile.js');
  const session = read('src/launcher/browser-session.js');
  assert.match(desktop, /profileDirectory:\s*['"]desktop['"]/);
  assert.match(desktop, /contextOptions:\s*\{\}/);
  assert.match(mobile, /profileDirectory/);
  assert.match(mobile, /android-mobile/);
  assert.match(mobile, /getAndroidMobileProfile/);
  assert.match(session, /validateRuntime/);
  assert.match(session, /launchPersistentContext/);
  assert.match(session, /headless:\s*false/);
  assert.match(session, /profileDirectory/);
});

test('repeatable profile probe 讀取並比較實際 client properties', () => {
  const session = read('src/launcher/browser-session.js');
  const validation = read('src/validation/validate-client-profiles.js');
  for (const property of [
    /navigator\.userAgent/,
    /window\.innerWidth/,
    /window\.innerHeight/,
    /window\.devicePixelRatio/,
    /navigator\.maxTouchPoints/,
  ]) {
    assert.match(session, property);
  }
  assert.match(session, /name=["']viewport["']/);
  assert.match(validation, /launchDesktop/);
  assert.match(validation, /launchAndroidMobile/);
  assert.match(validation, /userAgent/);
  assert.match(validation, /innerWidth/);
  assert.match(validation, /maxTouchPoints/);
  assert.match(validation, /CLIENT_PROFILE_DIFFERENCE_PASS/);
});

test('client profile comparator 接受實測 rounding 並拒絕相同 profile', () => {
  const { assertProfileDifferences } = require('../src/validation/validate-client-profiles.js');
  const desktop = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/151 Safari/537.36',
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    maxTouchPoints: 0,
  };
  const mobile = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/151 Mobile Safari/537.36',
    innerWidth: 412,
    innerHeight: 840,
    devicePixelRatio: 2.6250000596,
    maxTouchPoints: 1,
  };
  assert.doesNotThrow(() => assertProfileDifferences(desktop, mobile));
  assert.throws(() => assertProfileDifferences(desktop, { ...mobile, userAgent: desktop.userAgent }), /User-Agent/);
  assert.throws(() => assertProfileDifferences(desktop, { ...mobile, maxTouchPoints: 0 }), /touch/);
});

test('Issue #5 不加入禁止或後續功能', () => {
  const combined = [
    read('scripts/start.bat'),
    read('scripts/validate-profiles.bat'),
    read('src/launcher/start.js'),
    read('src/launcher/browser-session.js'),
    read('src/launcher/android-mobile.js'),
    read('src/profiles/android-mobile.js'),
    read('src/validation/validate-client-profiles.js'),
  ].join('\n');
  for (const forbidden of [
    /\brunas\b/i,
    /\bsetx\b/i,
    /\bHKLM\b/i,
    /New-Service|sc(?:\.exe)?\s+create/i,
    /npm(?:\.cmd)?\s+(?:install|i).*(?:--global|-g\b)/i,
    /update\.bat|proxy|stealth|fingerprint|anti-detect|CAPTCHA/i,
    /DEVICE_DESCRIPTOR_NAME\s*=\s*['"]iPhone|webkit\.launch|firefox\.launch/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test('文件記錄 descriptor、模式切換、差異與邊界', () => {
  const profiles = read('docs/PROFILES.md');
  const readme = read('README.md');
  const usage = read('docs/USAGE.md');
  assert.match(profiles, /Pixel 7/);
  assert.match(profiles, /Playwright `1\.62\.1`/);
  assert.match(profiles, /412 × 839/);
  assert.match(profiles, /412 × 915/);
  assert.match(profiles, /2\.625/);
  assert.match(profiles, /\| `isMobile` \| `true` \|/);
  assert.match(profiles, /\| `hasTouch` \| `true` \|/);
  assert.match(readme, /Desktop／Android Mobile 瀏覽模式與 viewport 截圖已提供/);
  assert.match(usage, /\[1\] Desktop/);
  assert.match(usage, /\[2\] Android 手機/);
  assert.match(usage, /不等於真正的 Android 手機/);
});

test('新增 batch validation 使用無 BOM CRLF', () => {
  assertCrlfBatch('scripts/validate-profiles.bat');
});

'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const WINDOWS_INVALID_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f\u0080-\u009f]+/g;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(?:\..*)?$/i;
const SUPPORTED_MODES = new Set(['desktop', 'android-mobile']);
const MAX_SITE_IDENTIFIER_LENGTH = 80;
const MAX_COLLISION_ATTEMPTS = 10_000;

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function formatLocalTimestamp(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error('截圖時間無效。');
  return {
    dateDirectory: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    timeComponent: `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}`,
  };
}

function sanitizeSiteIdentifier(value) {
  let identifier = String(value || '')
    .normalize('NFKC')
    .replace(WINDOWS_INVALID_CHARACTERS, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[ .-]+|[ .-]+$/g, '')
    .slice(0, MAX_SITE_IDENTIFIER_LENGTH)
    .replace(/[ .]+$/g, '');

  if (!identifier || identifier === '.' || identifier === '..') identifier = 'unknown-site';
  if (WINDOWS_RESERVED_NAME.test(identifier)) identifier = `site-${identifier}`;
  return identifier;
}

function siteIdentifierFromUrl(urlValue) {
  try {
    const url = new URL(String(urlValue));
    if (url.hostname) return sanitizeSiteIdentifier(url.hostname);
    if (url.protocol === 'about:') return sanitizeSiteIdentifier(`about-${url.pathname || 'blank'}`);
    if (url.protocol === 'file:') return 'local-file';
    if (url.protocol === 'data:' || url.protocol === 'blob:') return 'local-document';
    return sanitizeSiteIdentifier(url.protocol.replace(/:$/, '') || 'unknown-site');
  } catch {
    return 'unknown-site';
  }
}

function assertInside(child, parent, message) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(message);
}

function displayPath(relativePath) {
  return relativePath.split(path.sep).join('\\');
}

async function captureViewportScreenshot(options) {
  const {
    page,
    mode,
    repoRoot,
    now = new Date(),
    screenshotsRoot = path.join(repoRoot, 'screenshots'),
  } = options;

  if (!page || typeof page.screenshot !== 'function' || (typeof page.isClosed === 'function' && page.isClosed())) {
    throw new Error('沒有可截圖的作用中網頁。');
  }
  if (!SUPPORTED_MODES.has(mode)) throw new Error(`不支援的截圖模式：${mode}`);

  const canonicalRoot = path.resolve(repoRoot, 'screenshots');
  const requestedRoot = path.resolve(screenshotsRoot);
  assertInside(requestedRoot, canonicalRoot, '截圖路徑不得逃出 repo-local screenshots 資料夾。');

  const timestamp = formatLocalTimestamp(now);
  const siteIdentifier = siteIdentifierFromUrl(page.url());
  const dateDirectory = path.join(requestedRoot, timestamp.dateDirectory);
  assertInside(dateDirectory, canonicalRoot, '截圖路徑不得逃出 repo-local screenshots 資料夾。');

  let png;
  try {
    png = await page.screenshot({ type: 'png', fullPage: false });
  } catch (error) {
    throw new Error(`Playwright 無法擷取目前網頁 viewport（${error.message}）`);
  }

  try {
    await fs.mkdir(dateDirectory, { recursive: true });
  } catch (error) {
    throw new Error(`無法準備截圖資料夾：${dateDirectory}（${error.message}）`);
  }

  const baseName = `${timestamp.timeComponent}_${siteIdentifier}_${mode}`;
  for (let collision = 0; collision < MAX_COLLISION_ATTEMPTS; collision += 1) {
    const suffix = collision === 0 ? '' : `-${pad(collision)}`;
    const filename = `${baseName}${suffix}.png`;
    const absolutePath = path.join(dateDirectory, filename);
    assertInside(absolutePath, canonicalRoot, '截圖路徑不得逃出 repo-local screenshots 資料夾。');

    try {
      await fs.writeFile(absolutePath, png, { flag: 'wx' });
      const relativePath = path.relative(path.resolve(repoRoot), absolutePath);
      return {
        absolutePath,
        relativePath,
        displayPath: displayPath(relativePath),
        filename,
        mode,
        siteIdentifier,
      };
    } catch (error) {
      if (error.code === 'EEXIST') continue;
      throw new Error(`無法寫入截圖：${absolutePath}（${error.message}）`);
    }
  }

  throw new Error('快速連續截圖碰撞次數過多，未寫入任何檔案。');
}

async function chooseActivePage(context) {
  const pages = context.pages().filter((page) => !(typeof page.isClosed === 'function' && page.isClosed()));
  if (pages.length === 0) throw new Error('沒有可截圖的作用中網頁。');

  for (const page of [...pages].reverse()) {
    try {
      if (await page.evaluate(() => document.visibilityState) === 'visible') return page;
    } catch {
      // Navigation can temporarily make a page unevaluable; use the safe fallback below.
    }
  }
  return pages.at(-1);
}

module.exports = {
  captureViewportScreenshot,
  chooseActivePage,
  formatLocalTimestamp,
  sanitizeSiteIdentifier,
  siteIdentifierFromUrl,
};

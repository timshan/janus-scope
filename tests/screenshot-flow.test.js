'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const test = require('node:test');

const {
  captureViewportScreenshot,
  chooseActivePage,
  formatLocalTimestamp,
  sanitizeSiteIdentifier,
} = require('../src/screenshot/screenshot-service.js');
const { startScreenshotConsole } = require('../src/screenshot/screenshot-console.js');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

function temporaryRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'janus-scope-screenshot-'));
}

function mockPage(url = 'https://example.com/path') {
  const calls = [];
  return {
    calls,
    isClosed: () => false,
    url: () => url,
    screenshot: async (options) => {
      calls.push(options);
      return PNG;
    },
  };
}

test('檔名時間、site identifier 與 Windows reserved name 安全化', () => {
  const now = new Date(2026, 7, 31, 9, 8, 7, 6);
  assert.deepEqual(formatLocalTimestamp(now), {
    dateDirectory: '2026-08-31',
    timeComponent: '090807006',
  });
  assert.equal(sanitizeSiteIdentifier('example.com'), 'example.com');
  assert.equal(sanitizeSiteIdentifier('bad<>:"/\\|?* name. '), 'bad-name');
  assert.equal(sanitizeSiteIdentifier('CON'), 'site-CON');
  assert.equal(sanitizeSiteIdentifier('nul.txt'), 'site-nul.txt');
  assert.equal(sanitizeSiteIdentifier('...'), 'unknown-site');
});

test('目前 viewport PNG 僅寫入 repo-local screenshots 且 mode 可辨識', async (t) => {
  const repoRoot = temporaryRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const page = mockPage();

  const result = await captureViewportScreenshot({
    page,
    mode: 'desktop',
    repoRoot,
    now: new Date(2026, 7, 31, 9, 8, 7, 6),
  });

  assert.deepEqual(page.calls, [{ type: 'png', fullPage: false }]);
  assert.equal(result.relativePath, path.join('screenshots', '2026-08-31', '090807006_example.com_desktop.png'));
  assert.ok(result.absolutePath.startsWith(path.join(repoRoot, 'screenshots') + path.sep));
  assert.deepEqual(fs.readFileSync(result.absolutePath), PNG);
});

test('相同毫秒快速截圖不覆寫，about:blank 仍有安全檔名', async (t) => {
  const repoRoot = temporaryRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const now = new Date(2026, 7, 31, 9, 8, 7, 6);
  const page = mockPage('about:blank');

  const first = await captureViewportScreenshot({ page, mode: 'android-mobile', repoRoot, now });
  const second = await captureViewportScreenshot({ page, mode: 'android-mobile', repoRoot, now });

  assert.notEqual(first.absolutePath, second.absolutePath);
  assert.match(path.basename(first.absolutePath), /about-blank_android-mobile\.png$/);
  assert.match(path.basename(second.absolutePath), /about-blank_android-mobile-01\.png$/);
  assert.deepEqual(fs.readFileSync(first.absolutePath), PNG);
  assert.deepEqual(fs.readFileSync(second.absolutePath), PNG);
});

test('寫入失敗不 fallback，後續使用同一 page 仍可再截圖', async (t) => {
  const repoRoot = temporaryRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const blockedRoot = path.join(repoRoot, 'screenshots', 'blocked');
  fs.mkdirSync(path.dirname(blockedRoot), { recursive: true });
  fs.writeFileSync(blockedRoot, 'not a directory');
  const page = mockPage();

  await assert.rejects(
    captureViewportScreenshot({ page, mode: 'desktop', repoRoot, screenshotsRoot: blockedRoot }),
    /無法準備截圖資料夾/,
  );
  assert.deepEqual(fs.readdirSync(repoRoot), ['screenshots']);

  const recovered = await captureViewportScreenshot({ page, mode: 'desktop', repoRoot });
  assert.ok(fs.existsSync(recovered.absolutePath));
  assert.equal(page.isClosed(), false);
});

test('截圖 root 不得逃出 repo-local screenshots 邊界', async (t) => {
  const repoRoot = temporaryRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const page = mockPage();
  await assert.rejects(
    captureViewportScreenshot({
      page,
      mode: 'desktop',
      repoRoot,
      screenshotsRoot: path.join(repoRoot, 'screenshots', '..', 'outside'),
    }),
    /不得逃出 repo-local screenshots/,
  );
});

test('作用中 page 優先使用 visible tab，查詢失敗時安全退回最新 page', async () => {
  const hidden = { isClosed: () => false, evaluate: async () => 'hidden' };
  const visible = { isClosed: () => false, evaluate: async () => 'visible' };
  assert.equal(await chooseActivePage({ pages: () => [visible, hidden] }), visible);

  const broken = { isClosed: () => false, evaluate: async () => { throw new Error('navigating'); } };
  assert.equal(await chooseActivePage({ pages: () => [hidden, broken] }), broken);
  await assert.rejects(chooseActivePage({ pages: () => [] }), /沒有可截圖的作用中網頁/);
});

test('console s 命令回報正體中文路徑，截圖失敗後 session 仍可繼續', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = '';
  output.on('data', (chunk) => { text += chunk.toString(); });
  const page = { isClosed: () => false, evaluate: async () => 'visible' };
  const context = { pages: () => [page] };
  let attempts = 0;
  const controller = startScreenshotConsole({
    context,
    mode: 'desktop',
    repoRoot: 'C:\\JanusScope',
    input,
    output,
    capture: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('存取被拒');
      return { displayPath: 'screenshots\\2026-08-31\\capture_desktop.png' };
    },
  });

  input.write('s\ns\n');
  await new Promise((resolve) => setImmediate(resolve));
  await controller.stop();

  assert.equal(attempts, 2);
  assert.match(text, /\[截圖錯誤\] 截圖失敗：存取被拒/);
  assert.match(text, /Browser session 會繼續執行/);
  assert.match(text, /\[截圖\] 已儲存：screenshots\\2026-08-31\\capture_desktop\.png/);
});

test('Screenshot validation 與安全邊界維持 Issue #8 範圍', () => {
  const root = path.resolve(__dirname, '..');
  const validationBatch = fs.readFileSync(path.join(root, 'scripts', 'validate-screenshots.bat'));
  const batchText = validationBatch.toString('utf8');
  assert.equal(validationBatch.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false);
  assert.match(batchText, /\r\n/);
  assert.doesNotMatch(batchText.replaceAll('\r\n', ''), /[\r\n]/);

  const sources = [
    'src/screenshot/screenshot-service.js',
    'src/screenshot/screenshot-console.js',
    'src/validation/validate-screenshots.js',
  ].map((relative) => fs.readFileSync(path.join(root, relative), 'utf8')).join('\n');
  assert.match(sources, /page\.screenshot/);
  assert.doesNotMatch(sources, /launchPersistentContext|chromium\.launch|firefox|webkit/);
  assert.doesNotMatch(sources, /\bHAR\b|\btrace\b|storageState|cookies\(|Authorization|request\.body|response\.body/i);
  assert.doesNotMatch(sources, /Electron|OCR|annotation|image diff|chain of custody|anti-detect/i);
});

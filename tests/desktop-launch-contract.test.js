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

test('root start.bat 只委派給 scripts\\start.bat 並保留 exit code', () => {
  const source = read('start.bat');
  assert.match(source, /call "%~dp0scripts\\start\.bat"/i);
  assert.match(source, /exit \/b %ERRORLEVEL%/i);
});

test('start script 僅使用 repo-local Node.js 與 browser path', () => {
  const source = read('scripts/start.bat');
  assert.match(source, /runtime\\node\\node\.exe/i);
  assert.match(source, /PLAYWRIGHT_BROWSERS_PATH/i);
  assert.match(source, /runtime\\browsers/i);
  assert.match(source, /src\\launcher\\desktop\.js/i);
  assert.match(source, /請先執行 setup\.bat/);
  assert.doesNotMatch(source, /\bwhere\s+(?:node|chrome|msedge)/i);
  assert.doesNotMatch(source, /Program Files|Google\\Chrome|Microsoft\\Edge/i);
});

test('runtime validator 綁定既有 runtime contract 並輸出完整版本資訊', () => {
  const source = read('src/runtime/validate-runtime.js');
  assert.match(source, /process\.execPath/);
  assert.match(source, /runtime-versions\.cmd/);
  assert.match(source, /node_modules[\s\S]*playwright[\s\S]*package\.json/);
  assert.match(source, /PLAYWRIGHT_BROWSERS_PATH/);
  assert.match(source, /chromium\.executablePath\(\)/);
  assert.match(source, /assertInside/);
  assert.match(source, /janusScopeVersion/);
  assert.match(source, /nodeVersion/);
  assert.match(source, /playwrightVersion/);
  assert.match(source, /chromiumRevision/);
  assert.doesNotMatch(source, /channel\s*:/i);
});

test('Desktop launcher 使用 headed persistent context 並等待正常關閉', () => {
  const source = read('src/launcher/desktop.js');
  assert.match(source, /launchPersistentContext\(/);
  assert.match(source, /headless:\s*false/);
  assert.match(source, /profile[\s\S]*desktop/);
  assert.match(source, /about:blank/);
  assert.match(source, /waitForEvent\(['"]close['"]\)/);
  assert.match(source, /browser\(\)\.version\(\)/);
  assert.match(source, /--validation-auto-close-ms=/);
  assert.doesNotMatch(source, /devices\[|isMobile|hasTouch|userAgent|screenshot\(|update\.bat/i);
});

test('validation auto-close 參數只接受有界正整數', () => {
  const { parseValidationAutoCloseMs } = require('../src/launcher/desktop.js');
  assert.equal(parseValidationAutoCloseMs([]), null);
  assert.equal(parseValidationAutoCloseMs(['--validation-auto-close-ms=2500']), 2500);
  assert.throws(() => parseValidationAutoCloseMs(['--validation-auto-close-ms=0']), /驗證自動關閉時間/);
  assert.throws(() => parseValidationAutoCloseMs(['--validation-auto-close-ms=60001']), /驗證自動關閉時間/);
  assert.throws(() => parseValidationAutoCloseMs(['--unknown']), /不支援的啟動參數/);
});

test('Issue #2 launcher 不含提權、持久系統修改或超出範圍功能', () => {
  const combined = [
    read('start.bat'),
    read('scripts/start.bat'),
    read('src/runtime/validate-runtime.js'),
    read('src/launcher/desktop.js'),
  ].join('\n');
  for (const forbidden of [
    /\brunas\b/i,
    /Start-Process[\s\S]*-Verb\s+RunAs/i,
    /\bsetx\b/i,
    /\bHKLM\b/i,
    /New-Service|sc(?:\.exe)?\s+create/i,
    /npm(?:\.cmd)?\s+(?:install|i).*(?:--global|-g\b)/i,
    /-EncodedCommand|-WindowStyle\s+Hidden/i,
    /fingerprint|anti-detect|CAPTCHA|proxy random/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test('使用文件只把 Desktop 標示為已提供', () => {
  const readme = read('README.md');
  const usage = read('docs/USAGE.md');
  assert.match(readme, /Desktop Chromium 啟動已提供/);
  assert.match(usage, /start\.bat/);
  assert.match(usage, /Desktop Chromium/);
  assert.match(usage, /關閉最後一個 JanusScope Chromium 視窗/);
  assert.match(usage, /Android Mobile[\s\S]*尚未實作/);
  assert.match(usage, /截圖[\s\S]*尚未實作/);
});

test('Issue #2 batch files 是無 BOM 的 CRLF', () => {
  assertCrlfBatch('start.bat');
  assertCrlfBatch('scripts/start.bat');
});

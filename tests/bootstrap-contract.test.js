'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));

const NODE_VERSION = '24.20.0';
const NODE_ARCHIVE = `node-v${NODE_VERSION}-win-x64.zip`;
const NODE_SHA256 = '6cac9ffbca8f6a47091e4b5c772e0606049c3871cb67d900c0cedde630e545ba';
const PLAYWRIGHT_VERSION = '1.62.1';

function readRuntimeConfig() {
  const entries = {};
  for (const line of read('config/runtime-versions.cmd').split(/\r?\n/)) {
    const match = line.match(/^set "([A-Z0-9_]+)=(.*)"$/i);
    if (match) entries[match[1]] = match[2];
  }
  return entries;
}

test('runtime 與使用資料均由 Git 排除', () => {
  const ignored = read('.gitignore').split(/\r?\n/);
  for (const entry of ['/runtime/', 'node_modules/', '/profile/', '/screenshots/', '/logs/']) {
    assert.ok(ignored.includes(entry), `缺少 .gitignore 項目：${entry}`);
  }
});

test('runtime 版本與官方 Node.js x64 ZIP 完整性固定', () => {
  const config = readRuntimeConfig();
  assert.equal(config.NODE_VERSION, NODE_VERSION);
  assert.equal(config.NODE_ARCHIVE, NODE_ARCHIVE);
  assert.equal(config.NODE_SHA256, NODE_SHA256);
  assert.equal(config.NODE_DIST_BASE_URL, `https://nodejs.org/dist/v${NODE_VERSION}`);
  assert.equal(config.NODE_CHECKSUMS_FILE, 'SHASUMS256.txt');
  assert.equal(config.PLAYWRIGHT_VERSION, PLAYWRIGHT_VERSION);
  assert.equal(config.PLAYWRIGHT_BROWSER, 'chromium');
});

test('Playwright 是有 lockfile 的精確 local dependency', () => {
  const pkg = readJson('package.json');
  const lock = readJson('package-lock.json');
  assert.equal(pkg.private, true);
  assert.equal(pkg.dependencies.playwright, PLAYWRIGHT_VERSION);
  assert.equal(lock.packages[''].dependencies.playwright, PLAYWRIGHT_VERSION);
  assert.equal(lock.packages['node_modules/playwright'].version, PLAYWRIGHT_VERSION);
  assert.match(lock.packages['node_modules/playwright'].integrity, /^sha512-/);
});

test('setup 不含提權、全域安裝、持久系統修改或 PowerShell policy workaround', () => {
  const source = `${read('setup.bat')}\n${read('scripts/setup.bat')}`;
  for (const forbidden of [
    /\brunas\b/i,
    /\bpowershell(?:\.exe)?\b/i,
    /\bmsiexec\b/i,
    /\bwinget\b/i,
    /\bchoco(?:latey)?\b/i,
    /npm(?:\.cmd)?\s+(?:install|i)[^\r\n]*(?:--global|-g\b)/i,
    /\bsetx\b/i,
    /\bHKLM[:\\]/i,
    /\bsc(?:\.exe)?\s+create\b/i,
    /Program Files/i,
    /-EncodedCommand|-enc\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.equal(fs.existsSync(path.join(root, 'scripts', 'setup-runtime.ps1')), false);
});

test('setup 僅使用 repo-local Node、npm、Playwright 與 browser path', () => {
  const source = read('scripts/setup.bat');
  assert.match(source, /runtime\\node/);
  assert.match(source, /node\.exe/);
  assert.match(source, /npm\.cmd/);
  assert.match(source, /call "%NPM_CMD%" ci/i);
  assert.match(source, /--ignore-scripts/);
  assert.match(source, /PLAYWRIGHT_BROWSERS_PATH/);
  assert.match(source, /runtime\\browsers/);
  assert.match(source, /node_modules\\playwright\\cli\.js/);
  assert.match(source, /install chromium/i);
  assert.doesNotMatch(source, /\bnpx\b/i);
});

test('Node.js 下載同時驗證 pinned 與 upstream checksum metadata', () => {
  const source = read('scripts/setup.bat');
  assert.match(source, /NODE_DIST_BASE_URL/);
  assert.match(source, /NODE_CHECKSUMS_FILE/);
  assert.match(source, /curl\.exe/);
  assert.match(source, /certutil\.exe[^\r\n]*-hashfile[^\r\n]*SHA256/i);
  assert.match(source, /UPSTREAM_SHA256/);
  assert.match(source, /NODE_SHA256/);
  assert.match(source, /tar\.exe[^\r\n]*-xf/i);
});

test('健康 runtime 重跑會略過無必要的重新安裝', () => {
  const source = read('scripts/setup.bat');
  assert.match(source, /:check_node/);
  assert.match(source, /:check_playwright/);
  assert.match(source, /:check_chromium/);
  assert.match(source, /\[略過\].*Node\.js/);
  assert.match(source, /\[略過\].*Playwright/);
  assert.match(source, /\[略過\].*Chromium/);
});

test('self-check 綁定 repo-local runtime 並實際啟動 headless Chromium', () => {
  const source = read('src/runtime/self-check.js');
  assert.match(source, /runtime-versions\.cmd/);
  assert.doesNotMatch(source, /runtime-versions\.json/);
  assert.match(source, /process\.execPath/);
  assert.match(source, /runtime[\s\S]*node[\s\S]*node\.exe/);
  assert.match(source, /PLAYWRIGHT_BROWSERS_PATH/);
  assert.match(source, /chromium\.executablePath\(\)/);
  assert.match(source, /chromium\.launch\(/);
  assert.match(source, /headless:\s*true/);
  assert.match(source, /process\.exitCode\s*=\s*1/);
});

test('一般使用者文件列出實際 upstream、固定版本與驗證方式', () => {
  const docs = read('docs/RUNTIME.md');
  for (const expected of [
    NODE_VERSION,
    NODE_ARCHIVE,
    NODE_SHA256,
    'https://nodejs.org/dist/',
    'SHASUMS256.txt',
    PLAYWRIGHT_VERSION,
    'https://registry.npmjs.org/',
    'PLAYWRIGHT_BROWSERS_PATH',
    'runtime\\node',
    'runtime\\browsers',
    'scripts\\self-check.bat',
  ]) {
    assert.ok(docs.includes(expected), `runtime 文件缺少：${expected}`);
  }
});

test('Windows batch 使用 cmd 可穩定讀取的 CRLF，且版本設定可直接 call', () => {
  for (const relative of ['setup.bat', 'scripts/setup.bat', 'scripts/self-check.bat', 'config/runtime-versions.cmd']) {
    const bytes = fs.readFileSync(path.join(root, relative));
    assert.notDeepEqual(bytes.subarray(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), `${relative} 不應含 BOM`);
    const text = bytes.toString('utf8');
    assert.equal(text.replaceAll('\r\n', '').includes('\n'), false, `${relative} 必須使用 CRLF`);
  }
});

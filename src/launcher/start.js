'use strict';

const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { launchAndroidMobile } = require('./android-mobile.js');
const { parseValidationOptions } = require('./browser-session.js');
const { launchDesktop } = require('./desktop.js');

class ModeSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModeSelectionError';
  }
}

function normalizeModeSelection(value) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '1' || normalized === 'desktop') return 'desktop';
  if (normalized === '2' || normalized === 'mobile') return 'mobile';
  throw new ModeSelectionError(`無效的瀏覽模式：${value || '空白輸入'}。請選擇 1（Desktop）或 2（Android 手機）。`);
}

function parseStartArguments(args) {
  if (args.length === 0 || args[0].startsWith('--')) {
    return { mode: null, validationArgs: [...args] };
  }
  const mode = normalizeModeSelection(args[0]);
  if (args[0] === '1' || args[0] === '2') {
    throw new ModeSelectionError('命令列模式請使用 desktop 或 mobile；數字 1／2 僅供互動選單使用。');
  }
  return { mode, validationArgs: args.slice(1) };
}

async function promptForMode() {
  console.log('請選擇瀏覽模式：');
  console.log('[1] Desktop');
  console.log('[2] Android 手機');
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question('請輸入 1 或 2：');
    return normalizeModeSelection(answer);
  } finally {
    prompt.close();
  }
}

async function start(args = process.argv.slice(2)) {
  const parsed = parseStartArguments(args);
  const mode = parsed.mode || await promptForMode();
  const validation = parseValidationOptions(parsed.validationArgs);

  if (mode === 'desktop') return launchDesktop(validation);
  if (mode === 'mobile') return launchAndroidMobile(validation);
  throw new ModeSelectionError(`無效的瀏覽模式：${mode}`);
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`[錯誤] JanusScope 啟動失敗：${error.message}`);
    if (error instanceof ModeSelectionError) {
      console.error('[提示] 請重新執行 start.bat，並選擇 1（Desktop）或 2（Android 手機）。');
    } else {
      console.error('[提示] Runtime 問題請執行 setup.bat；若遭資安政策阻擋，請交由管理單位確認，不要繞過安全機制。');
    }
    process.exitCode = 1;
  });
}

module.exports = {
  ModeSelectionError,
  normalizeModeSelection,
  parseStartArguments,
  promptForMode,
  start,
};

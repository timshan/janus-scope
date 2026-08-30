'use strict';

const readline = require('node:readline');
const { captureViewportScreenshot, chooseActivePage } = require('./screenshot-service.js');

function startScreenshotConsole(options) {
  const {
    context,
    mode,
    repoRoot,
    input = process.stdin,
    output = process.stdout,
    capture = captureViewportScreenshot,
  } = options;

  const prompt = readline.createInterface({ input, output, terminal: Boolean(input.isTTY && output.isTTY) });
  let queue = Promise.resolve();
  let stopped = false;

  const printHelp = () => {
    output.write('[截圖] 在這個視窗輸入 s 後按 Enter，可保存目前作用中的網頁 viewport；輸入 h 可再次顯示說明。\n');
  };

  const handleCommand = async (line) => {
    const command = String(line).trim().toLowerCase();
    if (command === 'h' || command === 'help' || command === '?') {
      printHelp();
      return;
    }
    if (command !== 's' && command !== 'screenshot') {
      if (command) output.write(`[提示] 不支援的命令：${command}。輸入 s 截圖，或輸入 h 顯示說明。\n`);
      return;
    }

    try {
      const page = await chooseActivePage(context);
      const result = await capture({ page, mode, repoRoot });
      output.write(`[截圖] 已儲存：${result.displayPath}\n`);
    } catch (error) {
      output.write(`[截圖錯誤] 截圖失敗：${error.message}\n`);
      output.write('[提示] Browser session 會繼續執行；請確認 screenshots 資料夾權限或資安政策後再試一次，不會改存到其他位置。\n');
    }
  };

  prompt.on('line', (line) => {
    queue = queue.then(() => handleCommand(line), () => handleCommand(line));
  });
  printHelp();

  return {
    async stop() {
      if (stopped) return queue;
      stopped = true;
      prompt.close();
      await queue;
    },
  };
}

module.exports = {
  startScreenshotConsole,
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { launchAndroidMobile } = require('../launcher/android-mobile.js');
const { launchDesktop } = require('../launcher/desktop.js');
const { captureViewportScreenshot } = require('../screenshot/screenshot-service.js');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const FIXED_COLLISION_TIME = new Date(2026, 7, 31, 23, 15, 30, 123);
const VALIDATION_HTML = `<!doctype html>
<html lang="zh-Hant"><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:sans-serif;margin:32px;background:#172554;color:#fff}main{padding:24px;border:3px solid #60a5fa;border-radius:16px}code{color:#fde68a}</style>
<title>JanusScope Screenshot Validation</title></head>
<body><main><h1>JanusScope 截圖驗證</h1><p id="mode"></p><p>本頁由本機 route 提供，不含真實案件資料。</p></main></body></html>`;

function assertPng(result) {
  const stat = fs.statSync(result.absolutePath);
  if (stat.size <= PNG_SIGNATURE.length) throw new Error(`PNG 檔案大小不合理：${result.absolutePath}`);
  const signature = fs.readFileSync(result.absolutePath).subarray(0, PNG_SIGNATURE.length);
  if (!signature.equals(PNG_SIGNATURE)) throw new Error(`檔案不是有效的 PNG signature：${result.absolutePath}`);
  return { ...result, bytes: stat.size };
}

function screenshotTask(mode, evidence) {
  return async ({ context, page, repoRoot }) => {
    try {
      await context.route('http://example.com/**', (route) => route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: VALIDATION_HTML,
      }));
      await page.goto('http://example.com/janus-scope-screenshot-validation');
      await page.locator('#mode').evaluate((element, value) => { element.textContent = `模式：${value}`; }, mode);

      const first = assertPng(await captureViewportScreenshot({ page, mode, repoRoot, now: FIXED_COLLISION_TIME }));
      evidence.push({ kind: `${mode}-png`, ...first });

      if (mode === 'desktop') {
        const collision = assertPng(await captureViewportScreenshot({ page, mode, repoRoot, now: FIXED_COLLISION_TIME }));
        if (collision.absolutePath === first.absolutePath) throw new Error('快速連續截圖發生覆寫。');
        evidence.push({ kind: 'rapid-collision', ...collision });

        await page.goto('about:blank');
        const specialUrl = assertPng(await captureViewportScreenshot({ page, mode, repoRoot }));
        if (!specialUrl.filename.includes('about-blank')) throw new Error(`about:blank 安全檔名不符：${specialUrl.filename}`);
        evidence.push({ kind: 'special-url', ...specialUrl });

        const blockedRoot = path.join(repoRoot, 'screenshots', '.validation-blocked-target');
        fs.writeFileSync(blockedRoot, 'controlled failure target');
        let failureMessage = null;
        try {
          await captureViewportScreenshot({ page, mode, repoRoot, screenshotsRoot: blockedRoot });
        } catch (error) {
          failureMessage = error.message;
        } finally {
          fs.rmSync(blockedRoot, { force: true });
        }
        if (!failureMessage || !failureMessage.includes('無法準備截圖資料夾')) {
          throw new Error(`受控 failure path 未清楚失敗：${failureMessage || '沒有錯誤'}`);
        }
        const sessionAlive = !page.isClosed() && await page.evaluate(() => document.visibilityState);
        evidence.push({ kind: 'failure-path', message: failureMessage, sessionAlive });
      }
    } finally {
      await context.close();
    }
  };
}

async function validateScreenshots() {
  const evidence = [];
  await launchDesktop({
    enableScreenshotConsole: false,
    sessionTask: screenshotTask('desktop', evidence),
  });
  await launchAndroidMobile({
    enableScreenshotConsole: false,
    sessionTask: screenshotTask('android-mobile', evidence),
  });

  for (const item of evidence) console.log(`SCREENSHOT_EVIDENCE=${JSON.stringify(item)}`);
  console.log('SCREENSHOT_VALIDATION_PASS');
  return evidence;
}

if (require.main === module) {
  validateScreenshots().catch((error) => {
    console.error(`[錯誤] Screenshot 實際驗證失敗：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  assertPng,
  screenshotTask,
  validateScreenshots,
};

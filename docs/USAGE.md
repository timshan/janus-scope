# JanusScope 使用說明

> **目前狀態：Portable Runtime Bootstrap 與 Desktop Chromium 啟動已可使用；Android Mobile、截圖、GUI 與 updater 尚未實作。以下未完成段落不應視為已提供。**

## 適用對象

這份文件是寫給一般 Windows 使用者看的，不要求具備 Node.js、Playwright 或程式開發經驗。

JanusScope 的目標是讓你在 Windows 電腦上，用桌面版或 Android 手機模擬環境開啟同一個網站，查看網站是否呈現不同內容，並在需要時保存截圖。

## 使用前提

MVP 預計支援：

- Windows x64
- 一般 User 權限
- 不需要 Administrator
- 不需要事先安裝 Node.js
- 不需要事先安裝 Chrome
- 不需要修改 Windows 系統 PATH

請把 JanusScope 放在你有寫入權限的資料夾，例如：

```text
D:\Tools\JanusScope\
```

不要放在你無法寫入的受保護系統資料夾，例如 `C:\Program Files\`。

## 第一次使用

第一次使用請執行：

```text
setup.bat
```

Setup 會在 JanusScope 自己的資料夾內準備 portable Node.js、local Playwright dependency 與 Playwright 管理的 Chromium。正常情況下不會要求 Administrator 權限或跳出 UAC 視窗。

完成後可重複執行：

```text
scripts\self-check.bat
```

如果 Trend Micro XDR、Application Control、Proxy 或其他機關安全政策阻擋下載或執行，JanusScope 會顯示錯誤並停止。**不要停用或繞過端點安全軟體。**固定版本、下載來源與完整性驗證方式請見 [`RUNTIME.md`](RUNTIME.md)。

## 平常啟動

完成 setup 後，執行：

```text
start.bat
```

JanusScope 會先檢查 repo-local Node.js、local Playwright dependency 與 `runtime\browsers` 內的 Playwright-managed Chromium，並輸出 JanusScope、Node.js、Playwright 與 Chromium revision／版本資訊。Runtime 不完整時會提示執行 `setup.bat` 並以非零 exit code 結束，不會改用系統 Node.js、Chrome 或 Edge。

檢查通過後會以 **Desktop** 模式開啟 headed Chromium 視窗。你可以直接在 Chromium 網址列輸入或貼上網址，並正常操作網站。關閉最後一個 JanusScope Chromium 視窗後，launcher process 會正常結束。

Desktop profile 存放於 repo-local `profile\desktop\`，不會進 Git。若 profile 無法寫入或執行遭端點安全政策阻擋，程式會清楚失敗；不要停用或繞過安全政策。

## 瀏覽模式

### Desktop

Desktop Chromium 已提供。它使用 Playwright 與 setup 準備的 repo-local Chromium，維持一般桌面預設行為，不加入 fingerprint randomization 或 anti-detect 修改。

### Android Mobile

Android Mobile 尚未實作。本 Issue 不會建立手機 User-Agent、mobile viewport、touch profile 或模式選單；請等待後續 Issue。

## 開啟網站

目前 Desktop 操作方式：

1. 執行 `start.bat`。
2. 確認訊息顯示 `[模式] Desktop` 與 runtime 版本。
3. 在開啟的 Chromium 視窗中輸入／貼上網址。
4. 正常操作網站。

不需要自行開啟 Chrome DevTools 修改 User-Agent。

## 截圖
截圖尚未實作；目前請勿把下列預定介面視為已提供。

截圖預計儲存在：

```text
screenshots\
```

檔名會盡量包含：

- 截圖時間
- 網站 host / domain
- Desktop 或 Mobile 模式

例如：

```text
20260829-201530_example.com_mobile.png
```

`screenshots/` 不會自動上傳 GitHub。

## 更新瀏覽器元件
Updater 尚未實作；目前請勿執行尚不存在的 `update.bat`。

瀏覽器與 Playwright 不會在每次啟動時強制更新。

需要更新時預計執行：

```text
update.bat
```

更新流程會一起處理 Playwright 與相容的 Chromium，避免只換掉其中一個元件造成版本不相容。

## 如果程式打不開

先確認：

1. JanusScope 所在資料夾是否可寫入。
2. `runtime/` 是否仍存在。
3. 是否出現 Trend Micro XDR、Windows Application Control 或其他資安軟體通知。
4. 公司 Proxy 或網路政策是否阻擋必要下載。

若 JanusScope 顯示 runtime 缺失，請執行 `setup.bat`；需要單獨重複驗證時可執行 `scripts\self-check.bat`。不要自行把不明來源的 `node.exe`、`chrome.exe` 或 DLL 複製進 runtime。

## 如何移除

JanusScope 採可攜式設計。正常情況下，在所有 JanusScope 視窗都關閉後，刪除整個 JanusScope 資料夾即可移除程式與本機 runtime。

如果你另外把截圖複製到其他資料夾，那些檔案不會隨 JanusScope 一起刪除。

## 安全注意事項

- 不要把帳號密碼、Cookie、Token 或其他敏感資料提交到公開 GitHub repository。
- 不要為了讓 JanusScope 執行而關閉 Trend Micro XDR / EDR 或防毒軟體。
- 如果機關資安政策禁止某個元件執行，應交由管理單位確認，而不是嘗試規避管制。

## 文件語言

JanusScope 主要提供台灣使用者使用，因此操作說明與一般使用者介面以台灣華語／正體中文為預設。
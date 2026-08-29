# JanusScope 使用說明

> **目前狀態：JanusScope 尚在開發初期，本文件先定義 MVP 完成後的一般使用流程。若目前 repository 尚未包含對應 script 或 Release，請勿把本文件中的預定操作視為已完成。**

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

MVP 完成後，第一次使用預計執行：

```text
setup.bat
```

Setup 會在 JanusScope 自己的資料夾內準備必要元件，包括 portable Node.js、Playwright 與 Playwright 管理的 Chromium。

正常情況下，不應跳出要求 Administrator 權限的 UAC 視窗。

如果 Trend Micro XDR、Application Control、Proxy 或其他機關安全政策阻擋下載或執行，JanusScope 應顯示錯誤訊息並停止。**不要停用或繞過端點安全軟體。**

## 平常啟動

完成 setup 後，平常預計執行：

```text
start.bat
```

JanusScope 會先檢查本機 runtime 是否完整，再讓你選擇瀏覽模式。

## 瀏覽模式

### Desktop

用一般桌面 Chromium 環境開啟網站，可用來確認網站在桌面瀏覽器下的正常呈現內容。

### Android Mobile

用 Playwright 設定 Android-style 手機瀏覽環境，包括手機 User-Agent、畫面大小、觸控能力與其他 mobile context 設定。

這是瀏覽器環境模擬，不等於一支真正的 Android 手機。如果未來遇到只在實體 Android / Android Emulator 顯示的內容，會由後續版本另外處理。

## 開啟網站

MVP 的最終介面仍在實作中，但操作原則會維持簡單：

1. 選擇 Desktop 或 Android Mobile。
2. 輸入／貼上網址，或在開啟的 Chromium 視窗中輸入網址。
3. 正常操作網站。
4. 需要保存畫面時使用 JanusScope 截圖功能。

不需要自行開啟 Chrome DevTools 修改 User-Agent。

## 截圖

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

若 JanusScope 顯示 runtime 缺失，依未來正式版本提供的修復／setup 指示操作。不要自行把不明來源的 `node.exe`、`chrome.exe` 或 DLL 複製進 runtime。

## 如何移除

JanusScope 採可攜式設計。正常情況下，在所有 JanusScope 視窗都關閉後，刪除整個 JanusScope 資料夾即可移除程式與本機 runtime。

如果你另外把截圖複製到其他資料夾，那些檔案不會隨 JanusScope 一起刪除。

## 安全注意事項

- 不要把帳號密碼、Cookie、Token 或其他敏感資料提交到公開 GitHub repository。
- 不要為了讓 JanusScope 執行而關閉 Trend Micro XDR / EDR 或防毒軟體。
- 如果機關資安政策禁止某個元件執行，應交由管理單位確認，而不是嘗試規避管制。

## 文件語言

JanusScope 主要提供台灣使用者使用，因此操作說明與一般使用者介面以台灣華語／正體中文為預設。
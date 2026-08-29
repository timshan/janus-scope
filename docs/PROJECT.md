# 專案定義

## 專案目的

JanusScope 是一套可攜式 Windows 網站檢視工具，讓一般使用者可以比較同一網站在 Desktop 與 Mobile 瀏覽環境下的實際呈現差異，並在需要時保存截圖。

本專案主要處理這類情境：網站可能依據 User-Agent、viewport、screen、觸控能力或其他裝置特徵，對桌面電腦與手機瀏覽器提供不同頁面。JanusScope 應讓使用者不需要自己安裝 Node.js、Playwright、瀏覽器開發工具或調整系統設定，就能進行這類檢視。

## 主要使用者

- 需要從 Windows 電腦查看手機版特定網站內容的調查、分析與一般辦公使用者。
- 使用受管理 Windows 電腦、沒有 Administrator 權限的使用者。

## 主要操作流程

1. 從可攜式資料夾啟動 JanusScope。
2. 輸入或開啟目標網址。
3. 選擇瀏覽模式：
   - Desktop
   - Android Mobile
4. 在正常的 Chromium 視窗中瀏覽與操作網站。
5. 需要時保存截圖。
6. 在適當時機透過受控制的更新流程更新本機 runtime。

## MVP 範圍

### 納入

- Windows 一般使用者權限執行。
- 可攜式 bootstrap 與 runtime。
- 專案本機的 Node.js。
- Local Playwright dependency。
- Playwright 管理、且存放在專案本機 runtime 路徑的 Chromium。
- Desktop 瀏覽 profile。
- Android-style Mobile 瀏覽 profile。
- 簡單的截圖功能。
- 可預期的截圖命名與儲存位置。
- Runtime 版本查詢與受控制的更新流程。
- Runtime 元件缺失、被安全政策阻擋或無法執行時，顯示清楚的錯誤訊息。

### 延後處理

- 超出啟動、模式選擇所需範圍的完整 GUI。
- 自動視覺差異比對。
- 批次網址掃描。
- 實體 Android 或 Android Emulator 整合。
- 複雜的案件／Session 管理。

## 明確不做

JanusScope 不是 anti-detect browser，也不以隱藏 automation 或突破網站安全機制為目標。本專案不提供瀏覽器指紋隨機化、CAPTCHA 繞過、帳密／憑證蒐集、匿名 VPN／Proxy、端點安全繞過，也不自行維護客製 Chromium engine。

## 部署前提

- 第一個支援平台為目前仍受支援的 Windows x64。
- 一般操作不得需要 Administrator 權限。
- 實際電腦可能受到 Trend Micro XDR / EDR 或其他等效安全政策管理。
- 若安全政策阻擋執行或下載，JanusScope 必須清楚回報，不能嘗試繞過。
- 企業網路可能存在 Proxy、應用程式控制或下載限制；Online bootstrap 先完成後，再評估 controlled/offline runtime 準備模式。

## MVP 成功條件

在乾淨且使用者具有寫入權限的資料夾中，一般 Windows 使用者能夠：

1. 不經 UAC 提權準備本機 runtime；
2. 啟動 Desktop Chromium session；
3. 啟動 Android-style Mobile Chromium session；
4. 正常互動瀏覽網站；
5. 保存截圖，並可從檔名辨識時間、網站 host 與瀏覽模式；
6. 重複執行上述流程，而且不需要全系統安裝或修改 Windows 系統設定。

## 使用者語言

JanusScope 的主要使用者位於台灣。面向一般使用者的文件、訊息與操作介面原則上使用台灣華語／正體中文（zh-TW）。
# JanusScope

JanusScope 是一套給 Windows 電腦使用的可攜式網站檢視工具，讓使用者可以用 **Desktop** 與 **Android Mobile** 兩種瀏覽環境開啟同一網站，查看網站是否因裝置類型而呈現不同內容，並在需要時直接保存截圖。

> **目前狀態：Portable Runtime Bootstrap 已提供；Desktop／Mobile 啟動、截圖、GUI 與 updater 尚未實作。**

## 為什麼需要 JanusScope

有些網站會依照瀏覽器環境、螢幕尺寸、觸控能力或 User-Agent 顯示不同頁面。JanusScope 的目的，是讓使用者不用自行安裝 Node.js、Playwright 或另外設定開發環境，也能在 Windows 電腦上快速切換桌面版與手機版瀏覽環境進行檢視。

## 專案目標

- 一般 Windows 使用者權限即可安裝、更新與執行，不需要系統管理員權限或 UAC 提權。
- 採可攜式設計，不使用 MSI、不修改系統 PATH、不建立 Windows 服務，也不依賴全域安裝的 Node.js / Playwright / Chrome。
- 使用專案自己的 Node.js、Playwright 與 Playwright 管理的 Chromium runtime。
- 至少提供兩種瀏覽模式：
  - Desktop
  - Android Mobile
- 讓使用者可以簡單、明確地保存目前網頁畫面的截圖。
- Browser runtime 可更新，避免長期使用過舊的瀏覽器版本。
- 可在受 Trend Micro XDR / EDR 等端點防護管理的環境中正常接受安全政策管控；JanusScope 不會嘗試停用、繞過或規避端點安全機制。

## 使用方式與目前完成範圍

Issue #1 已提供的第一次使用流程：

1. 在 Windows x64 的一般使用者可寫入資料夾取得 JanusScope。
2. 執行 `setup.bat` 準備 repo-local Node.js、Playwright 與 Playwright-managed Chromium。
3. 需要重複檢查 runtime 時，執行 `scripts\self-check.bat`。

`start.bat`、Desktop／Android Mobile 瀏覽、截圖與 `update.bat` 仍屬後續 Issue 範圍，尚未提供。實際完成狀態以 Releases、Issues 與 `docs/USAGE.md` 為準。

## 不做的事情

JanusScope 不是 anti-detect browser，也不以規避網站安全機制為目標。本專案不提供：

- 瀏覽器指紋隨機化
- CAPTCHA 繞過
- 帳號密碼或憑證蒐集
- VPN / 匿名代理服務
- XDR / EDR / 防毒軟體繞過
- 自行維護或 fork Chromium 瀏覽器引擎

## 文件

- [`docs/PROJECT.md`](docs/PROJECT.md)：專案定位、範圍與成功條件
- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)：不可漂移的硬性需求與 MVP 驗收條件
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)：技術架構與 runtime 生命週期
- [`docs/RUNTIME.md`](docs/RUNTIME.md)：Portable Runtime 固定版本、upstream、完整性與 self-check
- [`docs/USAGE.md`](docs/USAGE.md)：給一般使用者看的操作說明
- [`AGENTS.md`](AGENTS.md)：AI Agent 與開發者進入專案時必須遵守的工作規則

## 語言

本專案主要使用者位於台灣。README、安裝說明、操作說明、錯誤訊息與一般使用者介面原則上使用 **台灣華語／正體中文（zh-TW）**。程式碼識別字、標準名稱、API 名稱與必要技術術語可保留英文。
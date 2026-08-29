# 需求規格

本文件定義 JanusScope 不得漂移的專案 invariant，以及 MVP 必須通過的驗收要求。

## 不可漂移的硬性要求

### JS-INV-001 — 一般使用者權限執行
一般 setup、update、launch、browse 與 screenshot 流程**不得**要求 Windows Administrator 權限或 UAC 提權。

### JS-INV-002 — 不做全系統安裝
JanusScope 一般操作**不得**要求 MSI、`winget`、Chocolatey、global npm package、修改 system PATH、修改 HKLM、建立 Windows service 或寫入 Program Files。

### JS-INV-003 — 可攜式 runtime
Node.js、Playwright dependency 與 Playwright 管理的 Chromium **必須**能從 JanusScope 專案本機／runtime 本機路徑執行。不得依賴電腦既有的 global Node.js、Playwright、Chrome 或 Edge。

### JS-INV-004 — Runtime 與使用資料不得進 Git
下載的 runtime binaries、browser binaries、使用者 profile、screenshots、logs、credentials、cookies、tokens 與瀏覽所得網站資料**不得**提交進 repository。

### JS-INV-005 — 相容端點安全政策
JanusScope **不得**停用、規避、修改或要求排除 XDR、EDR、防毒、Application Control、Proxy 或其他等效企業安全機制。若安全機制阻擋某個操作，JanusScope 必須清楚失敗並回報，不得嘗試繞過。

### JS-INV-006 — Runtime 來源必須可說明
所有下載的第三方 runtime 元件必須來自預先定義、可查證的 upstream 來源；可行時應使用 upstream 提供的 integrity metadata、checksum 或專案定義的完整性驗證方式。

### JS-INV-007 — Browser engine 僅作為 dependency
Chromium 由 Playwright 管理。JanusScope 不得 fork、修改或自行維護 Chromium engine。

### JS-INV-008 — 不發展 anti-detect 功能
專案不得加入 fingerprint randomization、CAPTCHA bypass、credential harvesting、匿名 VPN／Proxy、endpoint-security bypass，或主要目的在規避網站／瀏覽器偵測的功能。

### JS-INV-009 — 台灣華語為預設使用者語言
面向一般使用者的 README、安裝／更新／操作說明、錯誤訊息與 UI 文字原則上必須使用台灣華語／正體中文（zh-TW）。程式碼識別字、API、套件名稱與必要技術術語可保留英文。

## MVP 功能需求

### JS-FUNC-001 — Bootstrap
一般 Windows 使用者必須可以從 JanusScope 資料夾，透過有文件說明的 bootstrap script 準備所需的本機 runtime。

### JS-FUNC-002 — Setup 可重複執行
在 runtime 已健康可用的情況下再次執行 setup，不得無必要地重新安裝，也不得破壞原本正常的 runtime。

### JS-FUNC-003 — Runtime 檢查
啟動前必須能檢查必要 runtime 元件是否存在且可用；若缺少、損壞或無法執行，必須提供一般使用者可理解、可採取行動的錯誤訊息。

### JS-FUNC-004 — Desktop 模式
JanusScope 必須可以啟動可互動操作的 Chromium Desktop session。

### JS-FUNC-005 — Android Mobile 模式
JanusScope 必須可以透過 Playwright 啟動 Android-style Mobile 模擬 session，至少設定：

- mobile User-Agent；
- mobile viewport / screen 特徵；
- touch support；
- Playwright mobile context 相關設定。

### JS-FUNC-006 — 模式必須清楚可辨識
使用者必須可以清楚知道目前正在啟動或使用哪一個瀏覽模式／profile。

### JS-FUNC-007 — 截圖
使用者必須能直接透過 JanusScope 保存目前觀察到的網頁畫面，不應要求另外安裝外部截圖軟體才能完成基本截圖工作。

### JS-FUNC-008 — 截圖檔名
截圖檔名應包含：

- 時間；
- 可取得時的目標 host / domain；
- 瀏覽模式；

且必須使用 Windows 檔案系統可安全使用的字元。

### JS-FUNC-009 — 截圖儲存位置
截圖必須儲存在本機且已被 `.gitignore` 排除的路徑，例如 `screenshots/`。不得自動提交或上傳。

### JS-FUNC-010 — Runtime 版本資訊
JanusScope 必須提供方式顯示目前使用中的 JanusScope、Node.js、Playwright 與 Chromium runtime 版本／revision，以利支援與更新判斷。

### JS-FUNC-011 — 受控制的更新
更新流程必須讓 Playwright 與其相容的 Playwright-managed Chromium 一致更新，不得獨立替換成任意 Chromium binary。

## 操作與部署需求

### JS-OPS-001 — 固定且可預期的 runtime 路徑
Runtime executable 應放在固定、文件化的 JanusScope 本機路徑，方便維護、除錯與企業 Application Control 檢視。

### JS-OPS-002 — 不使用隱蔽執行技巧
正常 script 不得使用 encoded PowerShell、隨機改 executable 檔名、藏在臨時目錄執行或其他刻意模糊 process 行為的方式。

### JS-OPS-003 — 失敗必須透明
遇到網路下載失敗、權限不足、XDR / Application Control 阻擋、dependency 缺少或 runtime 損壞時，必須以非零狀態結束相關操作，並顯示可理解的訊息，不得假裝成功。

### JS-OPS-004 — 可乾淨移除
原則上刪除 JanusScope 工作資料夾後，即應移除 JanusScope 本體與 runtime 狀態；使用者主動另存到其他位置的檔案除外。

## 初始平台邊界

- 第一個正式支援目標為 Windows x64。
- ARM64 與其他作業系統不屬於 MVP，除非後續 GitHub Issue 明確納入。
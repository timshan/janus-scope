# AGENTS.md

本 repository 採「規格與 Issue 先行」的開發方式。不得自行推測缺失的需求，也不得在沒有授權工作單的情況下擴大產品範圍。

## 必讀順序

進行任何實質修改前，依序閱讀：

1. `README.md`
2. `docs/PROJECT.md`
3. `docs/REQUIREMENTS.md`
4. `docs/ARCHITECTURE.md`
5. 授權本次工作的 GitHub Issue

若 Issue 與 `docs/REQUIREMENTS.md` 中的 invariant 衝突，必須停止並回報衝突，不得默默降低或繞過既有要求。

## 語言規則

- README、使用說明、安裝說明、更新說明、錯誤訊息與一般使用者會看到的介面文字，原則上使用台灣華語／正體中文（zh-TW）。
- 避免使用中國大陸慣用詞；優先採台灣常用語，例如「程式」、「資料夾」、「檔案」、「網頁」、「瀏覽器」、「設定」、「執行」。
- 程式碼識別字、API、套件名稱、標準技術術語與必要英文縮寫可保留英文。

## 工作規則

- 只處理目前 GitHub Issue 明確授權的範圍。
- 優先採小型、可審查、可驗證的變更。
- 不得新增第二個 product/control repository；JanusScope 明確採單 repo 模式。
- 不得把第三方 runtime 或瀏覽器 binary vendor 進 Git history。
- 不得提交 `runtime/`、瀏覽器 profile、截圖、logs、credentials、cookies、tokens 或任何瀏覽所得網站資料。
- 一般 setup、update、launch、browse、screenshot 流程不得要求 Windows Administrator 權限。
- 不得修改系統 PATH、HKLM、Windows services、Program Files、endpoint-security policy 或 global npm state。
- 不得停用、繞過、規避或要求排除 XDR / EDR / 防毒／應用程式控制機制。
- 不得加入 anti-detect、fingerprint randomization、CAPTCHA bypass、credential harvesting、匿名代理或 endpoint-security bypass 功能。
- Browser engine 是第三方 dependency；不得 fork 或自行維護 Chromium 作為本專案的一部分。

## PR 驗證要求

每一個實作 PR 至少必須說明：

- 修改了什麼；
- 對應哪個 Issue 與 acceptance criteria；
- 實際執行過哪些指令／測試；
- 是否有下載網路資源，以及來源；
- 是否寫入 JanusScope 工作目錄之外的位置；
- 是否曾要求 Administrator / UAC elevation；
- 已知限制或尚未驗證的假設。

如果當前環境無法驗證某項 acceptance criterion，必須明確寫出「未驗證」，不得宣稱已通過。
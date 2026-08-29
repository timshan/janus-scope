# JanusScope 技術架構

## 1. 架構目標

JanusScope 的技術架構必須同時滿足四件事：

1. **可攜式**：不要求電腦事先安裝 Node.js、Playwright 或指定瀏覽器。
2. **一般使用者權限**：setup、update、啟動與使用過程不得要求 Administrator / UAC 提權。
3. **瀏覽環境可切換**：同一套程式可以啟動 Desktop 與 Android Mobile 瀏覽環境。
4. **容易維護更新**：Playwright 與其相容的 Chromium 可以透過受控制流程更新，不把大型 browser binary 放進 Git。

## 2. 高階架構

```text
JanusScope
│
├─ Bootstrap / Runtime Manager
│  ├─ 準備 portable Node.js
│  ├─ 準備 local Playwright dependency
│  ├─ 準備 Playwright-managed Chromium
│  └─ 檢查 runtime 狀態與版本
│
├─ Launcher
│  ├─ Desktop
│  └─ Android Mobile
│
├─ Browser Profiles
│  ├─ desktop profile
│  └─ android mobile profile
│
└─ Screenshot
   ├─ capture
   ├─ filesystem-safe naming
   └─ local storage
```

JanusScope 不自行實作 browser engine，也不把 Chromium fork 進專案。Chromium 是 Playwright 管理的第三方 runtime dependency。

## 3. Repository 與本機 runtime 的分離

預計結構：

```text
janus-scope/
│
├─ README.md
├─ AGENTS.md
├─ package.json
├─ package-lock.json
│
├─ config/
│  └─ profiles/
│
├─ src/
│  ├─ launcher/
│  ├─ browser/
│  ├─ profiles/
│  ├─ screenshot/
│  └─ runtime/
│
├─ scripts/
│  ├─ setup.bat
│  ├─ start.bat
│  └─ update.bat
│
├─ docs/
│
├─ tests/
│
├─ runtime/            # 不進 Git
│  ├─ node/
│  ├─ browsers/
│  ├─ cache/
│  └─ runtime-manifest.json
│
├─ screenshots/        # 不進 Git
├─ profile/            # 不進 Git
└─ logs/               # 不進 Git
```

`runtime/`、`screenshots/`、`profile/` 與 `logs/` 必須由 `.gitignore` 排除。

## 4. Portable Node.js

Node.js 採官方 Windows ZIP 版本，不使用 MSI，也不做全系統安裝。

目標位置：

```text
runtime/node/
```

JanusScope script 可以在**目前 process 範圍內**暫時調整 PATH，使 `node.exe` / `npm.cmd` 可以互相找到，但不得使用 `setx` 或其他方式永久修改 Windows 使用者或系統 PATH。

## 5. Playwright 與 Chromium

Playwright 必須是 JanusScope 的 local dependency，不使用 `npm install -g`。

Chromium 由目前 Playwright 版本管理，並透過 `PLAYWRIGHT_BROWSERS_PATH` 指向：

```text
runtime/browsers/
```

更新時必須把 Playwright 與其相容 browser runtime 視為同一組相依關係，不得自行下載任意 Chromium 版本替換。

## 6. Bootstrap 流程

`setup.bat` 的預期責任：

```text
開始
 ↓
確認目前 Windows / architecture 支援
 ↓
確認工作資料夾可寫入
 ↓
確認 portable Node.js
 ├─ 已存在且健康 → 保留
 └─ 不存在 → 從文件化 upstream 來源下載、驗證、解壓
 ↓
安裝／確認 local Playwright dependency
 ↓
設定 repo-local browser path
 ↓
安裝／確認 Playwright-managed Chromium
 ↓
執行 runtime self-check
 ↓
成功 / 明確失敗
```

Setup 必須具備 idempotent 行為：健康環境重跑不得無必要地整套重裝。

## 7. 啟動流程

`start.bat` 不負責偷偷修復系統，也不應在每次啟動時強制升級 runtime。

預期流程：

```text
start.bat
 ↓
runtime validation
 ↓
模式選擇
 ├─ Desktop
 └─ Android Mobile
 ↓
啟動 Chromium
 ↓
正常互動瀏覽
```

如果 runtime 缺少或被安全政策阻擋，應顯示台灣華語的可理解錯誤訊息，並提示使用者應執行哪個 JanusScope 操作；不得嘗試規避安全機制。

## 8. Desktop Profile

Desktop 模式作為一般桌面瀏覽基準。MVP 應盡量使用 Playwright / Chromium 的正常桌面預設行為，不加入沒有需求依據的特殊 fingerprint 修改。

## 9. Android Mobile Profile

Android Mobile 模式透過 Playwright browser context 模擬手機瀏覽環境，至少包含：

- mobile User-Agent；
- viewport；
- screen characteristics；
- device scale factor（若採用的 profile 需要）；
- touch support；
- mobile context settings。

Profile 必須是明確、可讀的設定，不採每次啟動隨機產生 fingerprint 的設計。

## 10. 截圖

JanusScope 提供簡單截圖功能，輸出位置預設為：

```text
screenshots/
```

建議檔名：

```text
YYYYMMDD-HHMMSS_<host>_<mode>.png
```

例如：

```text
20260829-201530_example.com_mobile.png
```

檔名產生器必須清理 Windows 不允許的字元。

MVP 不要求 HAR、Trace、HTML snapshot、chain-of-custody 或其他數位鑑識功能。

## 11. Update 流程

`update.bat` 與 setup 分離。

更新原則：

- 平常 `start.bat` 不強制自動更新。
- 使用者主動執行 update 才進行 runtime 更新。
- 更新前後都要能取得版本資訊。
- Playwright 更新後，必須準備該版本相容的 Chromium。
- 更新失敗不得破壞原本仍健康可用的 runtime；可行時應採候選 runtime 驗證後再切換的方式。

## 12. XDR / EDR 相容原則

JanusScope 的 process 與路徑應盡量固定、可說明，例如：

```text
scripts/start.bat
   └─ runtime/node/node.exe
        └─ runtime/browsers/.../chrome.exe
```

禁止：

- 停用或修改 Trend Micro XDR / EDR；
- 自動建立防毒排除；
- encoded PowerShell；
- 隨機重新命名 executable；
- 刻意把 executable 藏到 `%TEMP%` 後執行；
- 其他目的在逃避端點監控的技巧。

若安全政策阻擋 executable、下載或 child process，JanusScope 應清楚顯示錯誤並停止。

## 13. 使用者語言

一般使用者看到的文字以台灣華語／正體中文（zh-TW）為預設。內部程式碼、API、library 名稱與標準技術術語可以使用英文。

## 14. MVP 之外

下列能力不應在基線階段混入：

- 自動網站差異判斷；
- 大規模 URL 掃描；
- Android Emulator / 實體 Android 控制；
- anti-detect / browser fingerprint randomization；
- CAPTCHA bypass；
- Proxy / VPN anonymity；
- 自製 Chromium fork。

新增上述或其他大型能力，必須由新的 GitHub Issue 明確授權。
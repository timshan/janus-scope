# Portable Runtime 說明

本文件只說明 GitHub Issue #1 納入的 Windows x64 portable bootstrap。Desktop／Android Mobile 啟動與 client profile 請見 [`PROFILES.md`](PROFILES.md)；截圖、GUI 與 updater 尚未實作。

## 執行方式

請把 JanusScope 放在一般使用者可寫入的資料夾，從 repository 根目錄執行：

```bat
setup.bat
```

Setup 不會要求 Administrator / UAC 提權，也不會修改 persistent PATH、Registry、Windows service 或 global npm state。若下載、檔案寫入或執行被 Proxy、XDR / EDR、Application Control 或防毒政策阻擋，Setup 會顯示錯誤並以非零 exit code 結束；請交由管理單位確認，不要繞過安全政策。

完成後可以重複執行以下驗證：

```bat
scripts\self-check.bat
```

Self-check 會確認目前 process 使用 `runtime\node\node.exe`、local Playwright package 與 `runtime\browsers` 內的 Playwright-managed Chromium，並實際啟動後關閉一次 headless Chromium。這不是 Desktop 或 Mobile 正式啟動流程。

## 固定版本與 upstream

版本設定的唯一 repository 來源是 [`config/runtime-versions.cmd`](../config/runtime-versions.cmd)。Issue #1 初始固定版本如下：

| 元件 | 版本／檔案 | Upstream |
|---|---|---|
| Node.js | `24.20.0` / `node-v24.20.0-win-x64.zip` | `https://nodejs.org/dist/v24.20.0/` |
| Node.js checksum | `6cac9ffbca8f6a47091e4b5c772e0606049c3871cb67d900c0cedde630e545ba` | `https://nodejs.org/dist/v24.20.0/SHASUMS256.txt` |
| Playwright | `1.62.1` | `https://registry.npmjs.org/`；由 `package-lock.json` 固定 npm integrity |
| Chromium | Playwright `1.62.1` 對應 revision | 由 local Playwright CLI 的正式 `install chromium` 機制取得 |

Setup 下載 Node.js 官方 Windows x64 ZIP 前，會下載 `SHASUMS256.txt`，要求 upstream SHA-256 等於 repository pin，並以 Windows 內建 `certutil.exe -hashfile ... SHA256` 驗證實際 ZIP。任何一項不符都會停止，不會解壓該檔案。下載與解壓分別使用可稽核的 Windows 內建 `curl.exe` 與 `tar.exe`；不使用 PowerShell execution-policy workaround。

Playwright 只透過 repo-local `runtime\node\npm.cmd ci` 安裝，而且使用 lockfile；不使用 global npm。Chromium 不由 JanusScope 自行選版或下載任意 binary，而是透過 local Playwright CLI 安裝相容版本。

## Repo-local 路徑

```text
runtime\node\       portable Node.js
runtime\browsers\   Playwright-managed Chromium
runtime\cache\      Node.js ZIP、checksum 與 npm cache
node_modules\        lockfile 固定的 local Playwright dependency
```

Setup 只在目前 process 設定 `PATH`、`npm_config_cache` 與 `PLAYWRIGHT_BROWSERS_PATH`。其中 browser path 固定為 `runtime\browsers`；不會永久改動使用者或系統環境變數。

上述路徑均由 `.gitignore` 排除。不得把 Node.js、Chromium、`node_modules` 或其他 runtime 產物加入 Git。

## 重複執行與損壞處理

健康 runtime 重跑 Setup 時：

- Node.js 版本與執行檢查通過後略過下載／解壓；
- Playwright package 版本與載入檢查通過後略過 `npm ci`；
- Chromium 路徑與檔案檢查通過後略過 browser install；
- 最後仍會完整執行一次 self-check。

若 `runtime\node` 已存在但版本不符、損壞或無法執行，Setup 會停止，不會自動覆寫可能需要人工檢查的狀態。請先保留錯誤訊息並確認資安政策或檔案狀態，再決定是否移除損壞的 repo-local runtime 後重跑。

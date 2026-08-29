@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"
set "CONFIG_FILE=%REPO_ROOT%\config\runtime-versions.cmd"
set "RUNTIME_ROOT=%REPO_ROOT%\runtime"
set "NODE_DIR=%RUNTIME_ROOT%\node"
set "NODE_EXE=%NODE_DIR%\node.exe"
set "NPM_CMD=%NODE_DIR%\npm.cmd"
set "BROWSER_DIR=%RUNTIME_ROOT%\browsers"
set "CACHE_DIR=%RUNTIME_ROOT%\cache"
set "NPM_CACHE=%CACHE_DIR%\npm"
set "STAGING_DIR=%RUNTIME_ROOT%\node.staging"
set "SELF_CHECK=%REPO_ROOT%\src\runtime\self-check.js"

if not exist "%CONFIG_FILE%" (
  set "ERROR_MESSAGE=找不到 runtime 版本設定：%CONFIG_FILE%"
  goto :fail
)
call "%CONFIG_FILE%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法讀取 runtime 版本設定。"
  goto :fail
)
if /I not "%PLAYWRIGHT_BROWSER%"=="chromium" (
  set "ERROR_MESSAGE=Issue #1 bootstrap 僅允許 Playwright-managed Chromium。"
  goto :fail
)

call :check_architecture
if errorlevel 1 goto :fail
call :require_command curl.exe
if errorlevel 1 goto :fail
call :require_command certutil.exe
if errorlevel 1 goto :fail
call :require_command tar.exe
if errorlevel 1 goto :fail

if not exist "%RUNTIME_ROOT%" mkdir "%RUNTIME_ROOT%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法建立 runtime 資料夾；請確認 JanusScope 資料夾可寫入。"
  goto :fail
)
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法建立 runtime cache 資料夾。"
  goto :fail
)
if not exist "%BROWSER_DIR%" mkdir "%BROWSER_DIR%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法建立 Chromium runtime 資料夾。"
  goto :fail
)
>"%RUNTIME_ROOT%\.janus-scope-write-probe" echo probe
if errorlevel 1 (
  set "ERROR_MESSAGE=JanusScope 資料夾不可寫入：%REPO_ROOT%"
  goto :fail
)
del /q "%RUNTIME_ROOT%\.janus-scope-write-probe" >nul 2>&1

call :check_node
if errorlevel 1 goto :node_missing_or_unhealthy
echo [略過] Node.js v%NODE_VERSION% 已存在且健康。
goto :node_ready

:node_missing_or_unhealthy
if exist "%NODE_DIR%" (
  set "ERROR_MESSAGE=repo-local Node.js 存在但版本不符、損壞或無法執行；Setup 不會自動覆寫。"
  goto :fail
)
call :install_node
if errorlevel 1 goto :fail
call :check_node
if errorlevel 1 (
  set "ERROR_MESSAGE=repo-local Node.js 安裝後仍無法通過版本與執行檢查。"
  goto :fail
)

:node_ready
rem PATH 與 cache/browser 環境變數只在目前 batch process 生效。
set "PATH=%NODE_DIR%;%PATH%"
set "npm_config_cache=%NPM_CACHE%"
set "PLAYWRIGHT_BROWSERS_PATH=%BROWSER_DIR%"

call :check_playwright
if errorlevel 1 goto :install_playwright
echo [略過] Playwright %PLAYWRIGHT_VERSION% local dependency 已存在且健康。
goto :playwright_ready

:install_playwright
echo [執行] 使用 repo-local npm.cmd ci 安裝 lockfile 固定的 local dependency...
pushd "%REPO_ROOT%"
call "%NPM_CMD%" ci --ignore-scripts --no-audit --no-fund
set "NPM_EXIT=%ERRORLEVEL%"
popd
if not "%NPM_EXIT%"=="0" (
  set "ERROR_MESSAGE=repo-local npm ci 失敗，exit code：%NPM_EXIT%"
  goto :fail
)
call :check_playwright
if errorlevel 1 (
  set "ERROR_MESSAGE=Playwright local dependency 安裝後仍無法通過版本檢查。"
  goto :fail
)

:playwright_ready
call :check_chromium
if errorlevel 1 goto :install_chromium
echo [略過] Playwright-managed Chromium 已存在且健康。
goto :chromium_ready

:install_chromium
echo [執行] 使用 local Playwright CLI 安裝相容的 Chromium 到 runtime\browsers...
"%NODE_EXE%" "%REPO_ROOT%\node_modules\playwright\cli.js" install chromium
if errorlevel 1 (
  set "ERROR_MESSAGE=Playwright-managed Chromium 下載／安裝失敗。"
  goto :fail
)

:chromium_ready
echo [執行] 執行 repo-local Node.js / Playwright / Chromium self-check...
"%NODE_EXE%" "%SELF_CHECK%"
if errorlevel 1 (
  set "ERROR_MESSAGE=runtime self-check 失敗。"
  goto :fail
)
echo [完成] JanusScope runtime 已通過 self-check。
exit /b 0

:check_architecture
if /I "%PROCESSOR_ARCHITECTURE%"=="AMD64" exit /b 0
if /I "%PROCESSOR_ARCHITEW6432%"=="AMD64" exit /b 0
set "ERROR_MESSAGE=不支援目前的 Windows 架構；本版本僅支援 x64。"
exit /b 1

:require_command
where %~1 >nul 2>&1
if not errorlevel 1 exit /b 0
set "ERROR_MESSAGE=Windows 缺少必要內建指令 %~1，或該指令遭資安政策阻擋。"
exit /b 1

:check_node
if not exist "%NODE_EXE%" exit /b 1
if not exist "%NPM_CMD%" exit /b 1
set "ACTUAL_NODE_VERSION="
for /f "usebackq delims=" %%V in (`"%NODE_EXE%" --version 2^>nul`) do set "ACTUAL_NODE_VERSION=%%V"
if /I "%ACTUAL_NODE_VERSION%"=="v%NODE_VERSION%" exit /b 0
exit /b 1

:check_playwright
if not exist "%REPO_ROOT%\node_modules\playwright\package.json" exit /b 1
"%NODE_EXE%" -e "const p=require(process.argv[1]);if(p.version!==process.argv[2])process.exit(2)" "%REPO_ROOT%\node_modules\playwright\package.json" "%PLAYWRIGHT_VERSION%" >nul 2>&1
exit /b %ERRORLEVEL%

:check_chromium
"%NODE_EXE%" "%SELF_CHECK%" --files-only >nul 2>&1
exit /b %ERRORLEVEL%

:compute_sha256
set "ACTUAL_SHA256="
for /f "skip=1 tokens=* delims=" %%H in ('certutil.exe -hashfile "%~1" SHA256 2^>nul') do if not defined ACTUAL_SHA256 set "ACTUAL_SHA256=%%H"
set "ACTUAL_SHA256=%ACTUAL_SHA256: =%"
if not defined ACTUAL_SHA256 exit /b 1
exit /b 0

:install_node
set "ARCHIVE_PATH=%CACHE_DIR%\%NODE_ARCHIVE%"
set "CHECKSUMS_PATH=%CACHE_DIR%\%NODE_CHECKSUMS_FILE%"
set "CHECKSUMS_URL=%NODE_DIST_BASE_URL%/%NODE_CHECKSUMS_FILE%"
set "ARCHIVE_URL=%NODE_DIST_BASE_URL%/%NODE_ARCHIVE%"

echo [執行] 下載 Node.js 官方 checksum metadata：%CHECKSUMS_URL%
curl.exe --fail --location --show-error --output "%CHECKSUMS_PATH%" "%CHECKSUMS_URL%"
if errorlevel 1 (
  set "ERROR_MESSAGE=Node.js checksum metadata 下載失敗或遭網路／資安政策阻擋。"
  exit /b 1
)
set "UPSTREAM_SHA256="
for /f "tokens=1,2" %%A in ('findstr /I /C:"  %NODE_ARCHIVE%" "%CHECKSUMS_PATH%"') do set "UPSTREAM_SHA256=%%A"
if not defined UPSTREAM_SHA256 (
  set "ERROR_MESSAGE=官方 %NODE_CHECKSUMS_FILE% 找不到 %NODE_ARCHIVE% 的 SHA-256。"
  exit /b 1
)
if /I not "%UPSTREAM_SHA256%"=="%NODE_SHA256%" (
  set "ERROR_MESSAGE=Node.js pinned SHA-256 與 upstream metadata 不符；拒絕下載。"
  exit /b 1
)

if not exist "%ARCHIVE_PATH%" goto :download_node_archive
call :compute_sha256 "%ARCHIVE_PATH%"
if errorlevel 1 goto :discard_cached_archive
if /I "%ACTUAL_SHA256%"=="%NODE_SHA256%" (
  echo [略過] 已有完整性正確的 Node.js ZIP cache。
  goto :node_archive_ready
)

:discard_cached_archive
del /q "%ARCHIVE_PATH%" >nul 2>&1

:download_node_archive
echo [執行] 從 Node.js 官方來源下載 %NODE_ARCHIVE%...
curl.exe --fail --location --show-error --output "%ARCHIVE_PATH%" "%ARCHIVE_URL%"
if errorlevel 1 (
  set "ERROR_MESSAGE=Node.js ZIP 下載失敗或遭網路／資安政策阻擋。"
  exit /b 1
)

:node_archive_ready
call :compute_sha256 "%ARCHIVE_PATH%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法計算 Node.js ZIP SHA-256。"
  exit /b 1
)
if /I not "%ACTUAL_SHA256%"=="%NODE_SHA256%" (
  set "ERROR_MESSAGE=Node.js ZIP checksum 不符；檔案可能損壞或下載被攔截。"
  exit /b 1
)
if /I not "%ACTUAL_SHA256%"=="%UPSTREAM_SHA256%" (
  set "ERROR_MESSAGE=Node.js ZIP checksum 與 upstream metadata 不符。"
  exit /b 1
)

if exist "%STAGING_DIR%" rmdir /s /q "%STAGING_DIR%"
mkdir "%STAGING_DIR%"
if errorlevel 1 (
  set "ERROR_MESSAGE=無法建立 Node.js staging 資料夾。"
  exit /b 1
)
echo [執行] 解壓 Node.js ZIP 到 JanusScope runtime staging 資料夾...
tar.exe -xf "%ARCHIVE_PATH%" -C "%STAGING_DIR%"
if errorlevel 1 (
  set "ERROR_MESSAGE=Node.js ZIP 解壓失敗；檔案可能損壞或遭資安政策阻擋。"
  exit /b 1
)
if not exist "%STAGING_DIR%\node-v%NODE_VERSION%-win-x64\node.exe" (
  set "ERROR_MESSAGE=Node.js ZIP 結構不符預期，找不到 node.exe。"
  exit /b 1
)
move "%STAGING_DIR%\node-v%NODE_VERSION%-win-x64" "%NODE_DIR%" >nul
if errorlevel 1 (
  set "ERROR_MESSAGE=無法把 Node.js 放入 runtime\node。"
  exit /b 1
)
rmdir /s /q "%STAGING_DIR%"
exit /b 0

:fail
if not defined ERROR_MESSAGE set "ERROR_MESSAGE=未知錯誤。"
echo [錯誤] JanusScope Setup 失敗：%ERROR_MESSAGE%
echo [提示] 請確認資料夾權限、網路、Proxy 與端點資安政策；不要停用或繞過安全機制。
exit /b 1

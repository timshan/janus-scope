@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"
set "NODE_EXE=%REPO_ROOT%\runtime\node\node.exe"
set "BROWSER_DIR=%REPO_ROOT%\runtime\browsers"
set "LAUNCHER=%REPO_ROOT%\src\launcher\start.js"

if not exist "%NODE_EXE%" (
  echo [錯誤] 找不到 JanusScope repo-local Node.js：%NODE_EXE%
  echo [提示] 請先執行 setup.bat；不得改用系統 Node.js、Chrome 或 Edge。
  exit /b 1
)

"%NODE_EXE%" --version >nul 2>&1
if errorlevel 1 (
  echo [錯誤] JanusScope repo-local Node.js 無法執行或遭資安政策阻擋。
  echo [提示] 請先執行 setup.bat；若仍失敗，請交由管理單位確認，不要繞過安全機制。
  exit /b 1
)

if not exist "%LAUNCHER%" (
  echo [錯誤] 找不到 JanusScope 模式選擇／啟動程式：%LAUNCHER%
  echo [提示] 請重新取得完整 JanusScope 程式檔案。
  exit /b 1
)

rem Browser path 只在目前 batch process 生效；不修改 persistent Windows 設定。
set "PLAYWRIGHT_BROWSERS_PATH=%BROWSER_DIR%"

"%NODE_EXE%" "%LAUNCHER%" %*
set "LAUNCH_EXIT=%ERRORLEVEL%"
if not "%LAUNCH_EXIT%"=="0" (
  echo [錯誤] JanusScope 瀏覽模式啟動未完成，exit code：%LAUNCH_EXIT%
  exit /b %LAUNCH_EXIT%
)
exit /b 0

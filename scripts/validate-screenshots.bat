@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"
set "NODE_EXE=%REPO_ROOT%\runtime\node\node.exe"
set "BROWSER_DIR=%REPO_ROOT%\runtime\browsers"
set "VALIDATOR=%REPO_ROOT%\src\validation\validate-screenshots.js"

if not exist "%NODE_EXE%" (
  echo [錯誤] 找不到 JanusScope repo-local Node.js。請先執行 setup.bat。
  exit /b 1
)
if not exist "%VALIDATOR%" (
  echo [錯誤] 找不到 Screenshot 實際驗證程式。
  exit /b 1
)

set "PLAYWRIGHT_BROWSERS_PATH=%BROWSER_DIR%"
"%NODE_EXE%" "%VALIDATOR%"
exit /b %ERRORLEVEL%

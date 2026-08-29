@echo off
setlocal
chcp 65001 >nul

set "REPO_ROOT=%~dp0.."
set "NODE_EXE=%REPO_ROOT%\runtime\node\node.exe"
set "PLAYWRIGHT_BROWSERS_PATH=%REPO_ROOT%\runtime\browsers"

if not exist "%NODE_EXE%" (
  echo [錯誤] 找不到 JanusScope 專用 Node.js。請先執行 setup.bat。
  exit /b 1
)

"%NODE_EXE%" "%REPO_ROOT%\src\runtime\self-check.js"
exit /b %ERRORLEVEL%

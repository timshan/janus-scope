@echo off
setlocal
chcp 65001 >nul

call "%~dp0scripts\setup.bat"
exit /b %ERRORLEVEL%

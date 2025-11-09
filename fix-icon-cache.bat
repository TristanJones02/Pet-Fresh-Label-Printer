@echo off
echo Clearing Windows icon cache...

REM Delete icon cache
del /a /q "%localappdata%\IconCache.db"
del /a /f /q "%localappdata%\Microsoft\Windows\Explorer\iconcache*"

REM Kill and restart Explorer
echo Restarting Windows Explorer...
taskkill /f /im explorer.exe
timeout /t 2 /nobreak >nul
start explorer.exe

echo.
echo Icon cache cleared!
echo.
echo Next steps:
echo 1. Uninstall the Pet Fresh Label Printer app completely
echo 2. Delete the shortcut from desktop if it remains
echo 3. Rebuild and reinstall the app
echo.
pause
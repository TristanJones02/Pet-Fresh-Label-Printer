@echo off
echo Installing Pet Fresh Label Printer...
echo.
echo This installer will install Pet Fresh Label Printer to:
echo %PROGRAMFILES%\Pet Fresh Label Printer
echo.
pause

REM Create program directory
if not exist "%PROGRAMFILES%\Pet Fresh Label Printer" mkdir "%PROGRAMFILES%\Pet Fresh Label Printer"

REM Copy files
echo Copying application files...
xcopy "Pet Fresh Label Printer" "%PROGRAMFILES%\Pet Fresh Label Printer" /E /I /Q /Y

REM Create desktop shortcut
echo Creating desktop shortcut...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Pet Fresh Label Printer.lnk'); $Shortcut.TargetPath = '%PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe'; $Shortcut.Save()"

REM Create start menu shortcut
echo Creating start menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer"
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer\Pet Fresh Label Printer.lnk'); $Shortcut.TargetPath = '%PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe'; $Shortcut.Save()"

echo.
echo Installation completed successfully!
echo You can now run Pet Fresh Label Printer from:
echo - Desktop shortcut
echo - Start Menu
echo - Or directly from: %PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe
echo.
pause
@echo off
echo Creating Pet Fresh Label Printer Installer...

REM Create installer directory
if not exist "installer-package" mkdir installer-package

REM Copy the packaged app
echo Copying application files...
xcopy "dist\Pet Fresh Label Printer-win32-x64" "installer-package\Pet Fresh Label Printer" /E /I /Q

REM Create installer script
echo Creating installer script...
(
echo @echo off
echo echo Installing Pet Fresh Label Printer...
echo echo.
echo echo This installer will install Pet Fresh Label Printer to:
echo echo %PROGRAMFILES%\Pet Fresh Label Printer
echo echo.
echo pause
echo.
echo REM Create program directory
echo if not exist "%PROGRAMFILES%\Pet Fresh Label Printer" mkdir "%PROGRAMFILES%\Pet Fresh Label Printer"
echo.
echo REM Copy files
echo echo Copying application files...
echo xcopy "Pet Fresh Label Printer" "%PROGRAMFILES%\Pet Fresh Label Printer" /E /I /Q /Y
echo.
echo REM Create desktop shortcut
echo echo Creating desktop shortcut...
echo powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Pet Fresh Label Printer.lnk'^); $Shortcut.TargetPath = '%PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe'; $Shortcut.Save(^)"
echo.
echo REM Create start menu shortcut
echo echo Creating start menu shortcut...
echo if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer"
echo powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer\Pet Fresh Label Printer.lnk'^); $Shortcut.TargetPath = '%PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe'; $Shortcut.Save(^)"
echo.
echo echo.
echo echo Installation completed successfully!
echo echo You can now run Pet Fresh Label Printer from:
echo echo - Desktop shortcut
echo echo - Start Menu
echo echo - Or directly from: %PROGRAMFILES%\Pet Fresh Label Printer\Pet Fresh Label Printer.exe
echo echo.
echo pause
) > installer-package\install.bat

REM Create uninstaller
echo Creating uninstaller...
(
echo @echo off
echo echo Uninstalling Pet Fresh Label Printer...
echo echo.
echo set /p confirm="Are you sure you want to uninstall Pet Fresh Label Printer? (Y/N): "
echo if /i "%%confirm%%" neq "Y" goto :end
echo.
echo echo Removing application files...
echo rmdir /s /q "%PROGRAMFILES%\Pet Fresh Label Printer"
echo.
echo echo Removing shortcuts...
echo del "%USERPROFILE%\Desktop\Pet Fresh Label Printer.lnk" 2^>nul
echo rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Pet Fresh Label Printer" 2^>nul
echo.
echo echo Uninstallation completed!
echo :end
echo pause
) > installer-package\uninstall.bat

REM Create readme
echo Creating installation instructions...
(
echo Pet Fresh Label Printer - Installation Package
echo ============================================
echo.
echo This package contains everything needed to install Pet Fresh Label Printer.
echo.
echo INSTALLATION:
echo 1. Right-click on "install.bat" and select "Run as administrator"
echo 2. Follow the prompts to complete installation
echo 3. The application will be installed to Program Files
echo 4. Desktop and Start Menu shortcuts will be created
echo.
echo UNINSTALLATION:
echo 1. Right-click on "uninstall.bat" and select "Run as administrator"
echo 2. Confirm the uninstallation when prompted
echo.
echo RUNNING THE APP:
echo - Use the desktop shortcut, or
echo - Use the Start Menu shortcut, or  
echo - Navigate to Program Files\Pet Fresh Label Printer\Pet Fresh Label Printer.exe
echo.
echo FEATURES:
echo - Full kiosk mode (no window controls^)
echo - Settings accessible via gear icon
echo - Close app option in Settings ^> Application
echo - Emergency exit: Ctrl+Alt+Shift+X
echo.
echo For support, contact your system administrator.
) > installer-package\README.txt

echo.
echo ========================================
echo Installer package created successfully!
echo ========================================
echo.
echo Location: installer-package\
echo.
echo To distribute:
echo 1. Zip the entire "installer-package" folder
echo 2. Send the zip file to users
echo 3. Users extract and run "install.bat" as administrator
echo.
echo The installer package is ready for distribution!
echo.
pause
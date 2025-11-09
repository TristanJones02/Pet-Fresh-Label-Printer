@echo off
cd /d "C:\Users\TristanJones\Documents\GitHub\Pet-Fresh-Label-Printer\public\assets"

echo Creating multi-size icon...

REM Try to find magick.exe in PATH first
where magick >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set MAGICK=magick
) else (
    REM Look for ImageMagick in Program Files
    if exist "C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe" (
        set MAGICK="C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"
    ) else (
        echo ImageMagick not found! Please install from https://imagemagick.org/
        pause
        exit /b 1
    )
)

echo Using ImageMagick at: %MAGICK%

REM First extract the 256x256 image from existing ico
%MAGICK% icon.ico icon_source.png

REM Create different sizes
%MAGICK% icon_source.png -resize 16x16 icon_16.png
%MAGICK% icon_source.png -resize 24x24 icon_24.png
%MAGICK% icon_source.png -resize 32x32 icon_32.png
%MAGICK% icon_source.png -resize 48x48 icon_48.png
%MAGICK% icon_source.png -resize 64x64 icon_64.png
%MAGICK% icon_source.png -resize 128x128 icon_128.png
%MAGICK% icon_source.png -resize 256x256 icon_256.png

REM Combine all sizes into one ICO file
%MAGICK% icon_16.png icon_24.png icon_32.png icon_48.png icon_64.png icon_128.png icon_256.png icon_new.ico

REM Clean up temporary files
del icon_*.png

echo Icon created as icon_new.ico
echo Replace icon.ico with icon_new.ico when ready
pause
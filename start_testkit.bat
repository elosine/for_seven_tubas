@echo off
rem start_testkit.bat - double-click to start the Stand Test Kit (testkit/README.md)
rem Builds the kit's content from the piece first if it is missing (~90 s, first time only).
cd /d "%~dp0"
if not exist "testkit\assets\manifest.json" (
  echo Building the kit's content from the piece - about 90 seconds, first time only...
  node testkit\build_assets.js
  if errorlevel 1 (
    echo.
    echo Asset build FAILED - see the messages above.
    pause
    exit /b 1
  )
)
echo.
echo Starting the test kit server. Open the LAN address below on each device.
echo Leave this window open while testing; close it (or Ctrl+C) when done.
echo.
node testkit\server.js
pause

@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"
set "NPM_CMD=npm.cmd"
set "PYTHONUTF8="
set "PYTHONIOENCODING="

echo RealTimeVowelSpace launcher
echo.

if not exist "%BACKEND_PY%" (
  echo Backend environment was not found. Creating backend\.venv...
  where py >nul 2>nul
  if errorlevel 1 (
    where python >nul 2>nul
    if errorlevel 1 (
      echo Python was not found. Install Python 3.12 or newer, then run this launcher again.
      pause
      exit /b 1
    ) else (
      python -m venv "%BACKEND_DIR%\.venv"
    )
  ) else (
    py -3 -m venv "%BACKEND_DIR%\.venv"
  )
)

echo Installing or refreshing backend packages...
"%BACKEND_PY%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 (
  echo Backend package installation failed.
  pause
  exit /b 1
)

if exist "%ProgramFiles%\nodejs\npm.cmd" (
  set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
) else if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
  set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
) else (
  where npm.cmd >nul 2>nul
  if errorlevel 1 (
    echo npm.cmd was not found. Install Node.js LTS, close this window, then run this launcher again.
    pause
    exit /b 1
  )
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo Frontend packages were not found. Running npm install...
  pushd "%FRONTEND_DIR%"
  call "%NPM_CMD%" install
  if errorlevel 1 (
    popd
    echo Frontend package installation failed.
    pause
    exit /b 1
  )
  popd
)

echo.
echo Starting backend and frontend in two new windows...
start "RealTimeVowelSpace backend" "%ROOT%run-backend.cmd"
start "RealTimeVowelSpace frontend" "%ROOT%run-frontend.cmd"

echo.
echo The browser will open shortly. If it opens before the page is ready, wait a moment and refresh.
timeout /t 3 >nul
start "" "http://localhost:5173"

echo.
echo To stop the tool, close the two windows that were just opened, or press Ctrl+C in each one.
pause

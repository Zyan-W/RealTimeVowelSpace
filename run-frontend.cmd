@echo off
setlocal

set "FRONTEND_DIR=%~dp0frontend"
set "NODE_CMD=node.exe"

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
) else (
  where node.exe >nul 2>nul
  if errorlevel 1 (
    echo node.exe was not found. Install Node.js LTS, then run start-dev.cmd again.
    pause
    exit /b 1
  )
)

if not exist "%FRONTEND_DIR%\node_modules\vite\bin\vite.js" (
  echo Frontend packages were not found. Run start-dev.cmd first so it can install them.
  pause
  exit /b 1
)

cd /d "%FRONTEND_DIR%"
"%NODE_CMD%" node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort

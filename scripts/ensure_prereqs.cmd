@echo off
setlocal

set "NEED_PYTHON=0"
set "NEED_NODE=0"

call :has_python
if errorlevel 1 set "NEED_PYTHON=1"

call :has_node
if errorlevel 1 set "NEED_NODE=1"

if "%NEED_PYTHON%%NEED_NODE%"=="00" exit /b 0

echo Missing required runtime(s):
if "%NEED_PYTHON%"=="1" echo - Python 3.12 or newer
if "%NEED_NODE%"=="1" echo - Node.js LTS
echo.

where winget >nul 2>nul
if errorlevel 1 (
  echo winget was not found, so this launcher cannot install system runtimes automatically.
  echo Install Python 3.12 or newer and Node.js LTS manually, then run start-dev.cmd again.
  exit /b 1
)

if /I "%RVWS_AUTO_INSTALL_PREREQS%"=="1" (
  set "ANSWER=Y"
) else (
  set /p "ANSWER=Install the missing runtime(s) now with winget? [Y/N] "
)

if /I not "%ANSWER%"=="Y" if /I not "%ANSWER%"=="YES" (
  echo Installation canceled. Install the missing runtime(s), then run start-dev.cmd again.
  exit /b 1
)

if "%NEED_PYTHON%"=="1" (
  echo.
  echo Installing Python 3.12 with winget...
  winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements
  if errorlevel 1 exit /b 1
)

if "%NEED_NODE%"=="1" (
  echo.
  echo Installing Node.js LTS with winget...
  winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
  if errorlevel 1 exit /b 1
)

echo.
echo Runtime installation finished.
echo If the launcher still cannot find Python or Node.js, close this window and run start-dev.cmd again.
exit /b 0

:has_python
if exist "%~dp0..\backend\.venv\Scripts\python.exe" (
  call :check_python "%~dp0..\backend\.venv\Scripts\python.exe"
  if not errorlevel 1 exit /b 0
)
py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
  call :check_python "%LocalAppData%\Programs\Python\Python312\python.exe"
  if not errorlevel 1 exit /b 0
)
python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>nul
if not errorlevel 1 exit /b 0
exit /b 1

:check_python
"%~1" -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>nul
exit /b %ERRORLEVEL%

:has_node
if exist "%ProgramFiles%\nodejs\npm.cmd" exit /b 0
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" exit /b 0
where npm.cmd >nul 2>nul
if not errorlevel 1 exit /b 0
where npm >nul 2>nul
if not errorlevel 1 exit /b 0
exit /b 1

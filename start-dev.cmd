@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "PYTHONUTF8="
set "PYTHONIOENCODING="

echo RealTimeVowelSpace launcher
echo.

call "%ROOT%scripts\ensure_prereqs.cmd"
set "LAUNCHER_EXIT=!ERRORLEVEL!"
if not "!LAUNCHER_EXIT!"=="0" (
  if not "%RVWS_SMOKE_TEST%"=="1" pause
  exit /b !LAUNCHER_EXIT!
)

if exist "%ROOT%backend\.venv\Scripts\python.exe" (
  "%ROOT%backend\.venv\Scripts\python.exe" "%ROOT%scripts\bootstrap_dev.py"
  set "LAUNCHER_EXIT=!ERRORLEVEL!"
) else (
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 "%ROOT%scripts\bootstrap_dev.py"
    set "LAUNCHER_EXIT=!ERRORLEVEL!"
  ) else if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    "%LocalAppData%\Programs\Python\Python312\python.exe" "%ROOT%scripts\bootstrap_dev.py"
    set "LAUNCHER_EXIT=!ERRORLEVEL!"
  ) else (
    where python >nul 2>nul
    if errorlevel 1 (
      echo Python was not found. Install Python 3.12 or newer, then run this launcher again.
      set "LAUNCHER_EXIT=1"
    ) else (
      python "%ROOT%scripts\bootstrap_dev.py"
      set "LAUNCHER_EXIT=!ERRORLEVEL!"
    )
  )
)
if not "%RVWS_SMOKE_TEST%"=="1" pause
exit /b !LAUNCHER_EXIT!

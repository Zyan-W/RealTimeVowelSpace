@echo off
setlocal

set "PYTHONUTF8="
set "PYTHONIOENCODING="
set "BACKEND_DIR=%~dp0backend"
set "BACKEND_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"

cd /d "%BACKEND_DIR%"
"%BACKEND_PY%" -m uvicorn app.main:app --reload --port 8000

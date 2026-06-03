@echo off
setlocal

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING" /C:":5173 .*LISTENING"') do (
  taskkill /F /T /PID %%P >nul 2>nul
)

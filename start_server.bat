@echo off
cd /d "%~dp0"
if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do if not "%%A"=="" set "%%A=%%B"
)
if not defined APEX_HOST set APEX_HOST=127.0.0.1
if not defined APEX_PORT set APEX_PORT=8765
if not defined APEX_COOKIE_SECURE set APEX_COOKIE_SECURE=false
if not defined APEX_DATA_DIR set APEX_DATA_DIR=%CD%\data
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Could not install Python dependencies. Check your internet connection and Python installation.
  pause
  exit /b 1
)
python server.py
pause

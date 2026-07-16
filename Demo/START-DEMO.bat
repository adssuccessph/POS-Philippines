@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080/index.html
  py -m http.server 8080
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080/index.html
  python -m http.server 8080
  exit /b
)
echo Python was not found.
echo Upload this folder to GitHub Pages or install Python first.
pause

@echo off
cd /d "%~dp0"
echo ClutchMind backend with Riot API key
echo.
echo Do not put your Riot API key into app.js, index.html, or this batch file.
echo.
if defined RIOT_API_KEY (
  echo Using RIOT_API_KEY from your current environment.
  goto start
)
echo.
set /p RIOT_API_KEY=RIOT_API_KEY: 
echo.
:start
echo Starting backend on http://localhost:8787
"C:\Users\xiari\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
pause

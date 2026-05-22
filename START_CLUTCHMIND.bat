@echo off
cd /d "%~dp0"
title ClutchMind Coach
echo ========================================
echo        ClutchMind Coach
echo ========================================
echo.
echo This window must stay open while the app is running.
echo.
if not defined RIOT_API_KEY (
  echo Optional: paste your Riot API key for real match data.
  echo Leave empty and press Enter to start without Riot API.
  echo.
  set /p RIOT_API_KEY=RIOT_API_KEY: 
)
echo.
echo Starting app on:
echo http://localhost:8787/
echo.
"C:\Users\xiari\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
echo.
echo Server stopped. If you see an error above, send it to Codex.
pause

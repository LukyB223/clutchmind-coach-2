@echo off
cd /d "%~dp0"
echo Starting ClutchMind backend on http://localhost:8787
echo.
echo Real Riot data needs RIOT_API_KEY. Without it, use JSON import or fix the API connection.
echo.
"C:\Users\xiari\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
pause

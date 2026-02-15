@echo off
REM Serve current folder on port 8000 (requires Python in PATH)
REM Starts server in a new window and opens default browser to the site.
start "" python -m http.server 8000
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/"
echo Server started at http://localhost:8000/
echo Press any key to close this window (server will keep running in background window).
pause >nul

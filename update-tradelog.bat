@echo off
rem Chi.TradeLog update: pull latest code -> rebuild images -> restart services -> open browser.
rem Use this after code changes (or git pull); for plain daily startup use start-tradelog.bat instead.
cd /d "%~dp0"

rem Start Docker Desktop if the engine is not running, then wait until ready
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker Desktop is not running, starting it...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :wait_docker
    ping -n 4 127.0.0.1 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto wait_docker
)

echo Pulling latest code (skipped if already up to date)...
git pull --ff-only
if errorlevel 1 (
    echo WARNING: git pull failed or not fast-forward. Building with local code as-is.
)

echo Rebuilding and restarting Chi.TradeLog services (this may take a few minutes)...
docker compose up -d --build
if errorlevel 1 (
    echo Failed to rebuild services. See the error above.
    pause
    exit /b 1
)

echo Opening http://localhost:8080 ...
start "" "http://localhost:8080"
echo Update complete.
pause

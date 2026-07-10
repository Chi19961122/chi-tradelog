@echo off
rem Chi.TradeLog one-click start: ensure Docker engine is up -> start services -> open browser.
rem Double-click to run, or make a shortcut on Desktop / in the Startup folder.
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

echo Starting Chi.TradeLog services...
docker compose up -d
if errorlevel 1 (
    echo Failed to start services. See the error above.
    pause
    exit /b 1
)

echo Opening http://localhost:8080 ...
start "" "http://localhost:8080"

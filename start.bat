@echo off
setlocal enabledelayedexpansion
title Canit Pulse v4
cd /d "%~dp0"

echo ============================================
echo   Canit Pulse v4 - Setup ^& Launch
echo ============================================
echo.

:: ── BACKEND SETUP ──────────────────────────────────
echo [1/4] Checking Backend Dependencies...
cd /d "%~dp0backend"

:: Detect Python interpreter
set PYTHON=python
where python >nul 2>nul
if errorlevel 1 (
    where python3 >nul 2>nul
    if errorlevel 1 (
        echo   ^|_ [FAILED] Python not found. Install Python 3.10+^& try again.
        pause
        exit /b 1
    )
    set PYTHON=python3
)

if not exist "venv\" (
    echo   ^|_ Creating Python virtual environment...
    !PYTHON! -m venv venv
    if errorlevel 1 (
        echo   ^|_ [FAILED] Could not create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo   ^|_ Virtual environment exists.
)

echo   ^|_ Installing Python packages (this may take a few minutes)...
call venv\Scripts\activate.bat

pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo   [FAILED] pip install failed. Check the error above.
    pause
    exit /b 1
)

:: Install Playwright browsers (non-critical, skip if slow)
pip show playwright >nul 2>nul
if not errorlevel 1 (
    echo   ^|_ Installing Playwright browsers...
    python -m playwright install chromium 2>nul
)

call venv\Scripts\deactivate.bat
echo   ^|_ Backend dependencies ready.
echo.

:: ── FRONTEND SETUP ─────────────────────────────────
echo [2/4] Checking Frontend Dependencies...
cd /d "%~dp0frontend"

where node >nul 2>nul
if errorlevel 1 (
    echo   ^|_ [FAILED] Node.js not found. Install Node.js 18+^& try again.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo   ^|_ Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo   ^|_ [FAILED] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo   ^|_ node_modules exists.
)
echo   ^|_ Frontend dependencies ready.
echo.

:: ── LAUNCH SERVERS ─────────────────────────────────
echo [3/4] Starting Backend (FastAPI) on port 8000...
start "Canit Pulse - Backend" cmd /c "cd /d "%~dp0backend" ^&^& call venv\Scripts\activate.bat ^&^& echo Backend running at http://localhost:8000 ^&^& echo. ^& (uvicorn main:app --reload --port 8000 ^& echo. ^& echo Backend server exited. ^& pause)"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Frontend (Vite) on port 8081...
start "Canit Pulse - Frontend" cmd /c "cd /d "%~dp0frontend" ^&^& echo Frontend running at http://localhost:8081 ^&^& echo. ^& (npm run dev ^& echo. ^& echo Frontend server exited. ^& pause)"

echo.
echo ============================================
echo   Both servers are starting up!
echo     Backend  : http://localhost:8000
echo     Frontend : http://localhost:8081
echo.
echo   Close this window to stop (close each
echo   server window individually).
echo ============================================
echo.

pause

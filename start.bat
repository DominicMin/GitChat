@echo off
echo ================================
echo Starting GitChat...
echo ================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist "server\.env" (
    echo Warning: server\.env file not found!
    echo Please create it from server\.env.example
    echo.
    echo Creating .env from template...
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env"
        echo.
        echo Please edit server\.env and add your API key, then run this script again.
        pause
        exit /b 1
    ) else (
        echo Error: server\.env.example not found!
        pause
        exit /b 1
    )
)

echo [1/3] Starting backend server...
start "GitChat Server" cmd /k "cd server && npm start"

echo [2/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting frontend application...
start "GitChat Frontend" cmd /k "cd nodechat && npm start"

echo.
echo ================================
echo GitChat is starting!
echo ================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window (services will keep running)
pause >nul


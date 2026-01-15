@echo off
REM ============================================
REM Install Dependencies for All Services
REM ============================================

echo.
echo ============================================
echo Installing Dependencies
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] User Service...
cd user-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install User Service dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [2/6] Order Service...
cd order-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Order Service dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [3/6] Payment Service...
cd payment-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Payment Service dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [4/6] Inventory Service...
cd inventory-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Inventory Service dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [5/6] Notification Service...
cd notification-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Notification Service dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [6/6] Frontend...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo All Dependencies Installed!
echo ============================================
echo.
pause


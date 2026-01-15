@echo off
REM ============================================
REM Seed Database with Demo Data
REM ============================================

echo.
echo ============================================
echo Seeding Inventory Service Database
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)

cd inventory-service

REM Check if dependencies are installed
if not exist node_modules (
    echo Installing dependencies first...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        cd ..
        pause
        exit /b 1
    )
)

echo Running seed script...
call npm run seed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to seed database
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ============================================
echo Database Seeded Successfully!
echo ============================================
echo.
pause


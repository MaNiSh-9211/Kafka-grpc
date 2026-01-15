@echo off
REM ============================================
REM Start All Services with Docker
REM ============================================

echo.
echo ============================================
echo Starting All Services with Docker
echo ============================================
echo.

REM ============================================
REM Step 0: Verify Docker Desktop is Running
REM ============================================
echo Checking Docker Desktop...

REM Check if Docker command exists
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Docker is not installed
    echo ============================================
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker Desktop is running
echo Verifying Docker Desktop is running...
docker version >nul 2>&1
set DOCKER_EXIT=%ERRORLEVEL%
if %DOCKER_EXIT% EQU 0 (
    echo Docker Desktop is running and ready!
    echo.
    goto dockerCheckPassed
)

REM Docker check failed - show error
echo.
echo ============================================
echo ERROR: Docker Desktop is not responding
echo ============================================
echo.
echo Docker Desktop must be running before starting services.
echo.
echo Please:
echo 1. Open Docker Desktop application
echo 2. Wait for it to fully start (30-60 seconds)
echo 3. Look for whale icon in system tray
echo 4. Run this script again
echo.
echo Checking if Docker Desktop process exists...
tasklist | findstr /i "Docker Desktop" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Docker Desktop process found but not responding.
    echo Try restarting Docker Desktop.
) else (
    echo Docker Desktop is not running. Please start it.
)
echo.
pause
exit /b 1

:dockerCheckPassed

REM ============================================
REM Step 1: Clean Up Ports
REM ============================================
echo Cleaning up ports...
setlocal enabledelayedexpansion
set ports=5001 5002 5003 5004 5005 3000
for %%p in (%ports%) do (
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul
endlocal
echo Ports cleaned.
echo.

REM ============================================
REM Step 2: Start Kafka Infrastructure
REM ============================================
echo Starting Kafka infrastructure...
if not exist shared-infrastructure (
    echo ERROR: shared-infrastructure directory not found
    pause
    exit /b 1
)

cd shared-infrastructure

REM Verify Docker is still working before docker-compose
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Docker connection lost. Please check Docker Desktop.
    cd ..
    pause
    exit /b 1
)

REM Stop and remove existing containers
echo Cleaning up existing Kafka containers...
docker-compose down --remove-orphans 2>nul
docker rm -f kafka-zookeeper kafka-broker 2>nul

REM Verify Docker is still working
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Docker connection lost. Please check Docker Desktop.
    cd ..
    pause
    exit /b 1
)

REM Start Kafka
echo Starting Kafka and Zookeeper...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Failed to start Kafka infrastructure
    echo ============================================
    echo.
    echo Possible causes:
    echo - Docker Desktop is not running properly
    echo - Ports 2181 or 9092 are already in use
    echo - Docker Desktop needs to be restarted
    echo.
    echo To check Docker Desktop:
    echo   docker ps
    echo.
    echo To check port usage:
    echo   netstat -ano ^| findstr ":2181"
    echo   netstat -ano ^| findstr ":9092"
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

echo Waiting for Kafka to be ready...
REM Wait for Kafka container to be healthy
set maxAttempts=30
set attempt=0
:waitForKafka
set /a attempt+=1
if %attempt% GTR %maxAttempts% (
    echo.
    echo WARNING: Kafka readiness check timed out, but continuing anyway...
    echo Kafka container is running. If services fail to connect, check: docker logs kafka-broker
    echo.
    goto kafkaReady
)

REM Check if Docker is still working
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker connection lost while waiting for Kafka
    pause
    exit /b 1
)

REM Check if Kafka container is running
docker ps | findstr "kafka-broker" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Waiting for Kafka container to start... (attempt %attempt%/%maxAttempts%)
    timeout /t 2 /nobreak >nul
    goto waitForKafka
)

REM Check if Kafka is responding by trying to list topics (simpler check)
docker exec kafka-broker kafka-topics --bootstrap-server localhost:9092 --list >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Kafka is ready!
    timeout /t 3 /nobreak >nul
    goto kafkaReady
)

REM Alternative: just check if we can exec into the container (container is up)
docker exec kafka-broker echo >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Kafka container is running, waiting a bit more... (attempt %attempt%/%maxAttempts%)
    timeout /t 3 /nobreak >nul
    goto waitForKafka
)

timeout /t 2 /nobreak >nul
goto waitForKafka

:kafkaReady
echo.

REM ============================================
REM Step 3: Start All Microservices
REM ============================================
echo Starting all microservices...
echo.

REM Verify Docker is still working
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker connection lost. Please check Docker Desktop.
    pause
    exit /b 1
)

echo [1/5] User Service...
cd user-service
docker-compose down >nul 2>&1
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start User Service
    cd ..
    pause
    exit /b 1
)
cd ..
timeout /t 2 /nobreak >nul

echo [2/5] Order Service...
cd order-service
docker-compose down >nul 2>&1
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start Order Service
    cd ..
    pause
    exit /b 1
)
cd ..
timeout /t 2 /nobreak >nul

echo [3/5] Payment Service...
cd payment-service
docker-compose down >nul 2>&1
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start Payment Service
    cd ..
    pause
    exit /b 1
)
cd ..
timeout /t 2 /nobreak >nul

echo [4/5] Inventory Service...
cd inventory-service
docker-compose down >nul 2>&1
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start Inventory Service
    cd ..
    pause
    exit /b 1
)
cd ..
timeout /t 2 /nobreak >nul

echo [5/5] Notification Service...
cd notification-service
docker-compose down >nul 2>&1
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start Notification Service
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo Starting Frontend
echo ============================================
echo.

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo WARNING: Frontend dependencies not installed.
    echo Please run install.bat first to install dependencies.
    echo.
    echo Skipping frontend startup...
    echo.
    set FRONTEND_STARTED=0
) else (
    echo Starting Frontend in new window...
    cd frontend
    start "Frontend - KALFKA" cmd /k "npm run dev"
    cd ..
    set FRONTEND_STARTED=1
    timeout /t 3 /nobreak >nul
)

echo.
echo ============================================
echo All Services Started!
echo ============================================
echo.
echo Services:
echo - User Service: http://localhost:5001
echo - Order Service: http://localhost:5002
echo - Payment Service: http://localhost:5003
echo - Inventory Service: http://localhost:5004
echo - Notification Service: http://localhost:5005
echo - Kafka: localhost:9092
if %FRONTEND_STARTED% EQU 1 (
    echo - Frontend: http://localhost:3000 (or check the new window)
) else (
    echo - Frontend: Not started (run install.bat first, then start manually)
)
echo.
echo To stop all services, run: stop.bat
echo.
pause

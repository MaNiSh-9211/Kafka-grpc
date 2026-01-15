@echo off
REM ============================================
REM Stop All Services (Docker)
REM ============================================

echo.
echo ============================================
echo Stopping All Services
echo ============================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed
    pause
    exit /b 1
)

echo Stopping microservices...
cd user-service
docker-compose down >nul 2>&1
cd ..

cd order-service
docker-compose down >nul 2>&1
cd ..

cd payment-service
docker-compose down >nul 2>&1
cd ..

cd inventory-service
docker-compose down >nul 2>&1
cd ..

cd notification-service
docker-compose down >nul 2>&1
cd ..

echo Stopping Kafka infrastructure...
cd shared-infrastructure
docker-compose down >nul 2>&1
cd ..

echo Stopping frontend (if running)...
REM Kill processes using port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
REM Kill node processes that might be running vite (frontend)
taskkill /F /FI "WINDOWTITLE eq Frontend - KALFKA*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *Vite*" >nul 2>&1

echo.
echo ============================================
echo All Services Stopped!
echo ============================================
echo.
pause


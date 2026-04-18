@echo off
echo ========================================
echo   SmartBiz AI - Docker Quick Start
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [1/5] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker is running

echo.
echo [2/5] Setting up environment files...
if not exist "apps\backend\.env" (
    copy apps\backend\.env.example apps\backend\.env
    echo [CREATED] apps\backend\.env
) else (
    echo [EXISTS] apps\backend\.env
)

if not exist "apps\frontend\.env.local" (
    copy apps\frontend\.env.example apps\frontend\.env.local
    echo [CREATED] apps\frontend\.env.local
) else (
    echo [EXISTS] apps\frontend\.env.local
)

echo.
echo [3/5] Stopping existing containers...
docker-compose down >nul 2>&1
echo [DONE] Old containers stopped

echo.
echo [4/5] Building and starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)

echo.
echo [5/5] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Services running:
echo   Frontend:    http://localhost:5173
echo   Backend API: http://localhost:3001/api/v1
echo   ML Engine:   http://localhost:8000/docs
echo   PostgreSQL:  localhost:5432
echo.
echo Next steps:
echo   1. Edit apps\backend\.env with your email settings
echo   2. Run: docker-compose exec backend npx prisma migrate dev --name init
echo   3. Access the app at http://localhost:5173
echo.
echo Useful commands:
echo   View logs:       docker-compose logs -f
echo   Stop services:   docker-compose down
echo   Restart:         docker-compose restart
echo.
pause

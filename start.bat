@echo off
echo 🚀 Starting RecurAI Resume Screening System...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create it with the required environment variables.
    echo 📝 See setup.md for details.
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo 🔍 Checking PostgreSQL connection...
pg_isready >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not running. Please start PostgreSQL first.
    echo 💡 Start PostgreSQL service from Services or pgAdmin
    pause
    exit /b 1
)

REM Check if database exists
echo 🔍 Checking database...
psql -lqt | findstr /C:"recur_ai_db" >nul
if errorlevel 1 (
    echo 📊 Creating database...
    createdb recur_ai_db
    echo ✅ Database created successfully
)

REM Start backend
echo 🔧 Starting backend server...
cd JD-ResAIAgent

REM Check if virtual environment exists
if not exist "resAI" (
    echo 📦 Creating virtual environment...
    python -m venv resAI
)

REM Activate virtual environment
call resAI\Scripts\activate.bat

REM Install dependencies if needed
if not exist "resAI\.deps_installed" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    echo. > resAI\.deps_installed
)

REM Start backend in background
echo 🚀 Starting FastAPI backend...
start /B python main_enhanced.py

REM Go back to root directory
cd ..

REM Start frontend
echo 🎨 Starting Next.js frontend...
start /B npm run dev

echo.
echo ✅ RecurAI is starting up!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all services
pause >nul

echo 🛑 Stopping services...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo ✅ All services stopped


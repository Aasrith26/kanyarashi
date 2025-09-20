#!/bin/bash

# RecurAI Startup Script
echo "🚀 Starting RecurAI Resume Screening System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with the required environment variables."
    echo "📝 See setup.md for details."
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "💡 On macOS: brew services start postgresql"
    echo "💡 On Linux: sudo systemctl start postgresql"
    echo "💡 On Windows: Start PostgreSQL service"
    exit 1
fi

# Check if database exists
echo "🔍 Checking database..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw recur_ai_db; then
    echo "📊 Creating database..."
    createdb recur_ai_db
    echo "✅ Database created successfully"
fi

# Start backend
echo "🔧 Starting backend server..."
cd JD-ResAIAgent

# Check if virtual environment exists
if [ ! -d "resAI" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv resAI
fi

# Activate virtual environment
source resAI/bin/activate

# Install dependencies if needed
if [ ! -f "resAI/.deps_installed" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    touch resAI/.deps_installed
fi

# Start backend in background
echo "🚀 Starting FastAPI backend..."
python main_enhanced.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend
echo "🎨 Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ RecurAI is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait


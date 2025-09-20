#!/bin/bash

echo "🚀 Starting RecurAI Backend..."
echo "📊 Initializing database..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 5

# Initialize database
python init_db.py

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully!"
else
    echo "❌ Database initialization failed, but continuing..."
fi

echo "🌐 Starting FastAPI server..."
python main.py

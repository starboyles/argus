#!/bin/bash
echo "Starting Python backend..."
cd python-backend
source venv/bin/activate
python app.py &
PYTHON_PID=$!

echo "Starting Next.js frontend..."
cd ..
npm run dev &
NEXTJS_PID=$!

echo "Both services started!"
echo "Python backend: http://localhost:5000"
echo "Next.js frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $PYTHON_PID $NEXTJS_PID; exit" INT
wait
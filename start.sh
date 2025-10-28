#!/bin/bash

echo "================================"
echo "Starting GitChat..."
echo "================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "Warning: server/.env file not found!"
    echo "Please create it from server/.env.example"
    echo ""
    
    if [ -f "server/.env.example" ]; then
        echo "Creating .env from template..."
        cp "server/.env.example" "server/.env"
        echo ""
        echo "Please edit server/.env and add your API key, then run this script again."
        exit 1
    else
        echo "Error: server/.env.example not found!"
        exit 1
    fi
fi

echo "[1/3] Starting backend server..."
cd server && npm start &
SERVER_PID=$!

echo "[2/3] Waiting for server to initialize..."
sleep 3

echo "[3/3] Starting frontend application..."
cd ../nodechat && npm start &
CLIENT_PID=$!

echo ""
echo "================================"
echo "GitChat is running!"
echo "================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $SERVER_PID $CLIENT_PID


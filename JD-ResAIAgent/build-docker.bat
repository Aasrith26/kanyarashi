@echo off
REM Docker build script for RecurAI Backend (Windows)
REM This script builds and pushes the Docker image to Docker Hub

REM Configuration
set DOCKER_USERNAME=aasrith26
set IMAGE_NAME=recur-ai-backend
set TAG=latest

echo 🚀 Building RecurAI Backend Docker Image

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Build the image
echo 📦 Building Docker image...
docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% .

if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)

echo ✅ Docker image built successfully!

REM Login to Docker Hub
echo 🔐 Logging into Docker Hub...
docker login

if %errorlevel% neq 0 (
    echo ❌ Docker Hub login failed!
    pause
    exit /b 1
)

echo ✅ Logged into Docker Hub successfully!

REM Push the image
echo 📤 Pushing image to Docker Hub...
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

if %errorlevel% neq 0 (
    echo ❌ Failed to push image to Docker Hub!
    pause
    exit /b 1
)

echo ✅ Image pushed to Docker Hub successfully!
echo 🎉 Your image is available at: docker.io/%DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo 🚀 Docker build and push completed successfully!
pause

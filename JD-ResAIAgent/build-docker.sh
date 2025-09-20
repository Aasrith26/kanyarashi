#!/bin/bash

# Docker build script for RecurAI Backend
# This script builds and pushes the Docker image to Docker Hub

# Configuration
DOCKER_USERNAME="your_dockerhub_username"
IMAGE_NAME="recur-ai-backend"
TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Building RecurAI Backend Docker Image${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Build the image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

# Login to Docker Hub
echo -e "${YELLOW}🔐 Logging into Docker Hub...${NC}"
docker login

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Logged into Docker Hub successfully!${NC}"
else
    echo -e "${RED}❌ Docker Hub login failed!${NC}"
    exit 1
fi

# Push the image
echo -e "${YELLOW}📤 Pushing image to Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image pushed to Docker Hub successfully!${NC}"
    echo -e "${GREEN}🎉 Your image is available at: docker.io/${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}${NC}"
else
    echo -e "${RED}❌ Failed to push image to Docker Hub!${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Docker build and push completed successfully!${NC}"

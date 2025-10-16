#!/bin/bash

# Navigate to your project directory
cd /home/jjjjkemp/flag-game

# Pull the latest changes from the main branch
git pull origin main

# Stop and remove the old container
docker stop flag-game || true
docker rm flag-game || true

# Build the new Docker image
docker build -t flag-game .

# Run the new container, mapping internal port 80 to host port 8080
docker run -d --restart always --name flag-game -p 8080:80 flag-game

echo "🚀 Deployment finished successfully!"
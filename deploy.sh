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

# Run the new container on the shared proxy network
docker run -d --restart always --name flag-game --network=my_proxy_network flag-game

echo "🚀 Deployment finished successfully!"
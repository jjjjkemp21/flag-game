#!/bin/bash

# Navigate to your project directory
cd /home/jjjjkemp/your-repo-directory

# Pull the latest changes from the main branch
git pull origin main

# Stop and remove the old container (|| true prevents errors if container doesn't exist)
docker stop your-container-name || true
docker rm your-container-name || true

# Build the new Docker image
docker build -t flag-game .

# Run the new container
# The -p 8080:80 maps port 80 in the container to port 8080 on the Pi. Change if needed.
docker run -d --restart always --name flag-game -p 3000:80 flag-game

echo "🚀 Deployment finished successfully!"
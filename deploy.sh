#!/bin/bash

# Navigate to your project directory
cd /home/jjjjkemp/flag-game

# Pull the latest changes from the main branch
git pull origin main

# Stop and remove the old container (|| true prevents errors if container doesn't exist)
docker stop flag-game || true
docker rm flag-game || true

# Build the new Docker image
docker build -t flag-game .

# Run the new container
# The -p 8080:80 maps port 80 in the container to port 8080 on the Pi. Change if needed.
docker run -d --restart always --name flag-game -p 3000:443 flag-game

echo "🚀 Deployment finished successfully!"

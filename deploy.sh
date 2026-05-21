#!/bin/bash
set -e

# Navigate to your project directory
cd /home/jjjjkemp/flag-game

# Pull the latest changes from the main branch
git pull origin main

# Load secrets (JWT_SECRET, ADMIN_USERNAME) from an untracked .env file on the Pi.
# Example .env contents:
#   JWT_SECRET=some-long-random-string
#   ADMIN_USERNAME=jjjjkemp
if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

# Stop and remove the old container
docker stop flag-game || true
docker rm flag-game || true

# Build the new Docker image
docker build -t flag-game .

# Run the new container on the shared proxy network.
# - SQLite lives on a host volume so accounts/scores survive redeploys.
docker run -d --restart always --name flag-game --network=my_proxy_network \
  -v /home/jjjjkemp/flag-game-data:/data \
  -e DB_PATH=/data/flagquest.db \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e ADMIN_USERNAME="${ADMIN_USERNAME}" \
  flag-game

echo "🚀 Deployment finished successfully!"

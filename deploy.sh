#!/bin/bash
set -e

# Navigate to your project directory
cd /home/jjjjkemp/flag-game

# Record what we were on, then pull the latest changes from main.
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

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
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
  flag-game

# Auto-publish release notes from the commits in this deploy. Writes straight to
# the SQLite DB inside the container (no auth needed on the trusted host).
# Deduped by the deployed commit sha, so re-running a deploy won't double-post.
if [ "$BEFORE" != "$AFTER" ]; then
    TITLE="Update $(date +%Y-%m-%d)"
    BODY=$(git log --no-merges --pretty=format:'- %s' "$BEFORE..$AFTER")
    if [ -n "$BODY" ]; then
        # Give the container a moment to come up before writing.
        sleep 3
        docker exec flag-game node server/announce.js "$TITLE" "$BODY" "$AFTER" || true
    fi
fi

echo "🚀 Deployment finished successfully!"

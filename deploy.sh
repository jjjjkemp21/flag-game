#!/bin/bash
set -e

# Navigate to your project directory
cd /home/jjjjkemp/flag-game

# Record what we were on, then pull the latest changes from main.
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

# Load secrets (JWT_SECRET) from an untracked .env file on the Pi.
# Example .env contents:
#   JWT_SECRET=some-long-random-string
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
# - Admin status is no longer seeded from env vars; any signed-in user can
#   self-promote via the in-app 5-tap title prompt (see server/routes/auth.js).
docker run -d --restart always --name flag-game --network=my_proxy_network \
  -v /home/jjjjkemp/flag-game-data:/data \
  -e DB_PATH=/data/flagquest.db \
  -e JWT_SECRET="${JWT_SECRET}" \
  flag-game

# Auto-publish release notes for this deploy. Writes straight to the SQLite DB
# inside the container (no auth needed on the trusted host). Deduped by the
# deployed commit sha, so re-running a deploy won't double-post.
#
# Source of the note:
#   - If RELEASE_NOTES.md changed in this deploy, publish its top "## " section
#     (heading = title, lines below = Markdown body).
#   - Otherwise fall back to the latest commit's subject + full body.
if [ "$BEFORE" != "$AFTER" ]; then
    NOTES_CHANGED=$(git diff --name-only "$BEFORE" "$AFTER" -- RELEASE_NOTES.md)
    if [ -n "$NOTES_CHANGED" ] && [ -f RELEASE_NOTES.md ]; then
        TITLE=$(awk '/^## /{sub(/^## +/,""); print; exit}' RELEASE_NOTES.md)
        BODY=$(awk 'f&&/^## /{exit} /^## /{f=1; next} f{print}' RELEASE_NOTES.md)
    else
        TITLE=$(git log -1 --pretty=format:'%s' "$AFTER")
        BODY=$(git log -1 --pretty=format:'%b' "$AFTER")
    fi
    [ -z "$TITLE" ] && TITLE="Update $(date +%Y-%m-%d)"
    [ -z "$BODY" ] && BODY="$TITLE"
    # Give the container a moment to come up before writing.
    sleep 3
    docker exec flag-game node server/announce.js "$TITLE" "$BODY" "$AFTER" || true
fi

echo "🚀 Deployment finished successfully!"

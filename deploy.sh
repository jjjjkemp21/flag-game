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

# Build the NEW image FIRST, while the OLD container is still serving traffic.
# The build (npm install + CRA build + native better-sqlite3 compile) is the
# slow part on a Pi — minutes. Doing it before we stop anything means the site
# stays up the whole time instead of returning a Cloudflare 502 for the entire
# build. Bonus: with `set -e`, a failed build aborts HERE, before the old
# container is touched, so a broken build no longer takes the site down.
docker build -t flag-game .

# Swap. This is now the ONLY window the site is briefly unreachable — just the
# few seconds it takes to stop the old container and boot the new one, not the
# whole build. (True zero-downtime would need a second container + a proxy
# switch; this reorder removes ~all of the visible 502 for a one-line cost.)
docker stop flag-game || true
docker rm flag-game || true

# Run the new container on the shared proxy network.
# - SQLite lives on a host volume so accounts/scores survive redeploys.
# - Admin status is no longer seeded from env vars; any signed-in user can
#   self-promote via the in-app 5-tap title prompt (see server/routes/auth.js).
docker run -d --restart always --name flag-game --network=my_proxy_network \
  -v /home/jjjjkemp/flag-game-data:/data \
  -e DB_PATH=/data/flagquest.db \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e ADMIN_CLAIM_PASSWORD="${ADMIN_CLAIM_PASSWORD}" \
  flag-game

# Auto-publish release notes for this deploy — but ONLY when RELEASE_NOTES.md
# changed in this push. The commit-message fallback used to publish raw git
# subjects/bodies, which are developer-facing (refactor notes, file lists,
# author lines, etc.) and not appropriate for the in-app announcements bell.
# Announcements are now strictly user-facing: if there's no curated note for
# this release, nothing gets posted.
#
# Format: the top "## " heading becomes the title, the lines beneath it (up
# to the next "## ") become the Markdown body. Deduped by commit sha so
# re-running a deploy won't double-post.
if [ "$BEFORE" != "$AFTER" ]; then
    NOTES_CHANGED=$(git diff --name-only "$BEFORE" "$AFTER" -- RELEASE_NOTES.md)
    if [ -n "$NOTES_CHANGED" ] && [ -f RELEASE_NOTES.md ]; then
        TITLE=$(awk '/^## /{sub(/^## +/,""); print; exit}' RELEASE_NOTES.md)
        BODY=$(awk 'f&&/^## /{exit} /^## /{f=1; next} f{print}' RELEASE_NOTES.md)
        if [ -n "$TITLE" ] && [ -n "$BODY" ]; then
            # Give the container a moment to come up before writing.
            sleep 3
            docker exec flag-game node server/announce.js "$TITLE" "$BODY" "$AFTER" || true
        fi
    fi
fi

echo "🚀 Deployment finished successfully!"

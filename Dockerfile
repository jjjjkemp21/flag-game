# Stage 1: Build the React application
FROM node:18-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---

# Stage 2: Node server that serves the build AND the /api
FROM node:18-bookworm-slim
WORKDIR /app

# Build tools so better-sqlite3 can compile from source if no ARM prebuild matches.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install server dependencies (better-sqlite3 builds a native module here)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# App code + built frontend
COPY server ./server
COPY --from=builder /app/build ./build

EXPOSE 80
ENV PORT=80
CMD ["node", "server/index.js"]

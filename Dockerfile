# Simplified build for Railway - no Docker build during image creation
FROM node:18-slim

# Install only essential packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (smaller alternative)
RUN curl -fsSL https://get.docker.com | sh

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy and build frontend
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

RUN npm run build

# Copy and build backend
COPY backend/ ./backend/
RUN cd backend && npm run build

# Copy scenario definitions (build images at runtime, not build time)
COPY scenarios/ ./scenarios/
COPY docker/ ./docker/
COPY Makefile ./

# Setup file structure for serving
RUN mkdir -p public && cp -r out/* public/

WORKDIR /app/backend

# Expose port
EXPOSE $PORT

# Start backend server (builds scenario images on first use)
CMD ["node", "dist/index.js"]
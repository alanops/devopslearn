# Multi-stage build for full-stack Railway deployment
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Build frontend (static export)
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend-builder

# Install Docker CLI for scenario management
RUN apk add --no-cache docker-cli make

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./
COPY scenarios/ ./scenarios/
COPY docker/ ./docker/
COPY Makefile ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Docker CLI for runtime
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy built frontend to be served by backend
COPY --from=frontend-builder /app/out ./public

# Copy backend
COPY --from=backend-builder /app/dist ./
COPY --from=backend-builder /app/node_modules ./node_modules/
COPY --from=backend-builder /app/package.json ./

# Copy scenarios and docker setup
COPY --from=backend-builder /app/scenarios ./scenarios/
COPY --from=backend-builder /app/docker ./docker/
COPY --from=backend-builder /app/Makefile ./

# Expose port
EXPOSE $PORT

# Start the backend server (which will also serve frontend)
CMD ["node", "index.js"]
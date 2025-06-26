# Ultra-minimal build for Railway
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies (frontend)
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy and build frontend
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

RUN npm run build

# Copy backend package files and install
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev --no-audit --no-fund

# Copy and build backend
COPY backend/ ./backend/
RUN cd backend && npm run build

# Copy scenario definitions (no Docker installation - will use Railway's Docker)
COPY scenarios/ ./scenarios/
COPY docker/ ./docker/
COPY Makefile ./

# Setup file structure for serving
RUN mkdir -p public && cp -r out/* public/

WORKDIR /app/backend

# Expose port
EXPOSE $PORT

# Start backend server (scenarios will build at runtime using Railway's Docker)
CMD ["node", "dist/index.js"]
# Multi-stage build for Railway deployment
FROM node:18-alpine AS base

# Install Docker CLI for scenario management
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port Railway expects
EXPOSE $PORT

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
# SafeDay Self-Hosted Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend & CommonJS backend bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles from builder
COPY --from=builder /app/dist ./dist

# Create persistent storage folder for SQLite/JSON databases
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]

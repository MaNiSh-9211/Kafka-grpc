# Dockerfile for User Service
#
# This Dockerfile creates a container image for the User Service.
# The image can be deployed to any container orchestration platform (Kubernetes, Docker Swarm, etc.)

# Stage 1: Build
# Use Node.js 18 as the base image for building
# Alpine Linux is a lightweight Linux distribution (smaller image size)
FROM node:18-alpine AS builder

# Set working directory inside container
# All commands will run in this directory
WORKDIR /app

# Copy package files
# We copy package.json first to leverage Docker layer caching
# If package.json doesn't change, Docker can reuse cached layers
COPY package*.json ./

# Install dependencies
# npm install downloads and installs all dependencies
# --production=false ensures dev dependencies are also installed (needed for build)
RUN npm install

# Copy source code
# Copy all TypeScript source files
COPY . .

# Build TypeScript to JavaScript
# This compiles .ts files to .js files in the dist/ directory
RUN npm run build

# Stage 2: Runtime
# Use Node.js 18 Alpine for runtime (smaller than full Node.js image)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
# --production=true installs only dependencies (not devDependencies)
# This reduces image size
RUN npm install --production

# Copy built files from builder stage
# We only copy the dist/ directory (compiled JavaScript)
# Source files are not needed at runtime
COPY --from=builder /app/dist ./dist

# Create logs directory
# Winston logger writes logs to files in this directory
RUN mkdir -p logs

# Expose port
# This tells Docker that the container listens on port 5001
# It doesn't actually publish the port - that's done with -p flag or docker-compose
EXPOSE 5001

# Set environment variable for port
# This can be overridden when running the container
ENV PORT=5001

# Set environment variable for Kafka
# Default Kafka broker address
# Can be overridden when running the container
ENV KAFKA_BROKERS=localhost:9092

# Health check
# Docker/Kubernetes can use this to check if container is healthy
# Returns 0 if healthy, non-zero if unhealthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the service
# Start the Node.js application
# dist/index.js is the compiled main file
CMD ["node", "dist/index.js"]


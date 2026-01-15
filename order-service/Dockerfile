# Dockerfile for Order Service
#
# This Dockerfile creates a container image for the Order Service.

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy proto files (needed at runtime for gRPC)
COPY --from=builder /app/proto ./proto

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5002

# Set environment variables
ENV PORT=5002
ENV KAFKA_BROKERS=localhost:9092
ENV PAYMENT_SERVICE_URL=localhost:5003
ENV INVENTORY_SERVICE_URL=localhost:5004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the service
CMD ["node", "dist/index.js"]


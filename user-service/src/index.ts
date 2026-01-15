/**
 * User Service - Main Entry Point
 * 
 * Production-grade User Service with MongoDB integration
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { log } from './utils/logger';
import { createKafkaProducer } from './utils/kafka';
import { setupRoutes } from './routes';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// CORS configuration - allow frontend on port 3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  log.info(`[HTTP] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * Kafka producer instance
 */
let kafkaProducer: ReturnType<typeof createKafkaProducer>;

/**
 * Start the User Service
 */
async function start() {
  try {
    // Step 1: Connect to MongoDB
    log.info('[STARTUP] Connecting to MongoDB...');
    await connectDatabase();

    // Step 2: Create and connect Kafka producer
    log.info('[STARTUP] Connecting to Kafka...');
    kafkaProducer = createKafkaProducer();
    await kafkaProducer.connect();
    log.info('[STARTUP] ✅ Kafka producer connected');

    // Step 3: Setup HTTP routes
    setupRoutes(app, kafkaProducer);

    // Step 4: Start HTTP server
    app.listen(PORT, () => {
      log.info(`[STARTUP] ✅ User Service running on port ${PORT}`);
      log.info(`[STARTUP] Health check: http://localhost:${PORT}/health`);
      log.info(`[STARTUP] API: http://localhost:${PORT}/users`);
    });

    // Step 5: Setup graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('[SHUTDOWN] SIGTERM received, shutting down gracefully');
      await kafkaProducer.disconnect();
      await require('./config/database').disconnectDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      log.info('[SHUTDOWN] SIGINT received, shutting down gracefully');
      await kafkaProducer.disconnect();
      await require('./config/database').disconnectDatabase();
      process.exit(0);
    });
  } catch (error) {
    log.error('[STARTUP] ❌ Failed to start service:', error as Record<string, any>);
    process.exit(1);
  }
}

// Start the service
start();

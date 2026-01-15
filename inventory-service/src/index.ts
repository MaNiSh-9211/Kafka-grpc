/**
 * Inventory Service - Main Entry Point
 * 
 * Manages product inventory and stock levels.
 * Exposes gRPC server for synchronous inventory operations.
 */

import express from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { createKafkaProducer } from './utils/kafka';
import { connectDatabase } from './config/database';
import { setupGrpcServer } from './grpc';
import { setupKafka } from './kafka';
import { setupRoutes } from './routes';

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || process.env.PORT || 5004;
const GRPC_PORT = process.env.GRPC_PORT || 50041;

// CORS configuration - allow frontend on port 3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

/**
 * Event log store
 */
interface EventLog {
  id: string;
  topic: string;
  event: any;
  receivedAt: string;
  service: string;
  producerService?: string;
}

const eventLogs: EventLog[] = [];
(global as any).eventLogs = eventLogs;

let kafkaProducer: ReturnType<typeof createKafkaProducer>;

async function start() {
  try {
    // Step 1: Connect to MongoDB
    log.info('[STARTUP] Connecting to MongoDB...');
    await connectDatabase();
    log.info('[STARTUP] ✅ MongoDB connected');

    // Step 2: Connect to Kafka
    kafkaProducer = createKafkaProducer();
    await kafkaProducer.connect();
    log.info('[STARTUP] ✅ Kafka producer connected');

    // Step 3: Setup Kafka consumers
    await setupKafka(kafkaProducer);
    
    // Step 4: Setup gRPC server
    await setupGrpcServer(kafkaProducer);
    
    // Step 5: Setup HTTP routes
    setupRoutes(app, kafkaProducer);

    app.listen(HTTP_PORT, () => {
      log.info(`Inventory Service HTTP server running on port ${HTTP_PORT}`);
      log.info(`Health check: http://localhost:${HTTP_PORT}/health`);
      log.info(`gRPC server running on port ${GRPC_PORT}`);
    });

    // Step 6: Setup graceful shutdown
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

start();


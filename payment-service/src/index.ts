/**
 * Payment Service - Main Entry Point
 * 
 * This is the main file that starts the Payment Service.
 * 
 * What does Payment Service do?
 * - Processes payments and manages payment transactions
 * - Exposes gRPC server for synchronous payment processing
 * - Publishes payment events to Kafka
 * 
 * Service Architecture:
 * - HTTP Server: Exposes REST API for external clients
 * - gRPC Server: Exposes payment processing endpoints (synchronous)
 * - Kafka Producer: Publishes payment events
 * - Kafka Consumer: Consumes order events (optional)
 * - In-Memory Store: Stores payments (in production, use a database)
 * 
 * Communication:
 * - gRPC Server: Exposes ProcessPayment, RefundPayment, GetPaymentStatus
 * - Publishes to Kafka: payment.processed, payment.failed, payment.refunded
 * - Consumes from Kafka: order.created (optional)
 */

import express from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { createKafkaProducer } from './utils/kafka';
import { setupGrpcServer } from './grpc';
import { setupKafka } from './kafka';
import { setupRoutes } from './routes';

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || process.env.PORT || 5003;
const GRPC_PORT = process.env.GRPC_PORT || 50031;

// Middleware
// CORS configuration - allow frontend on port 3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

/**
 * Payment interface
 */
export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * In-memory payment store
 */
const payments: Map<string, Payment> = new Map();

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

/**
 * Kafka producer instance
 */
let kafkaProducer: ReturnType<typeof createKafkaProducer>;

/**
 * Start the Payment Service
 */
async function start() {
  try {
    // Step 1: Connect to Kafka
    kafkaProducer = createKafkaProducer();
    await kafkaProducer.connect();
    log.info('Kafka producer connected');

    // Step 2: Setup Kafka consumers
    await setupKafka(payments, kafkaProducer);

    // Step 3: Setup gRPC server
    await setupGrpcServer(payments, kafkaProducer);

    // Step 4: Setup HTTP routes
    setupRoutes(app, payments, kafkaProducer);

    // Step 5: Start HTTP server
    app.listen(HTTP_PORT, () => {
      log.info(`Payment Service HTTP server running on port ${HTTP_PORT}`);
      log.info(`Health check: http://localhost:${HTTP_PORT}/health`);
      log.info(`gRPC server running on port ${GRPC_PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('SIGTERM received, shutting down gracefully');
      await kafkaProducer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    log.error('Failed to start service', { error });
    process.exit(1);
  }
}

start();

export { payments };


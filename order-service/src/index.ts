/**
 * Order Service - Main Entry Point
 * 
 * This is the main file that starts the Order Service.
 * 
 * What does Order Service do?
 * - Creates and manages orders
 * - Orchestrates Payment Service (gRPC) for payment processing
 * - Orchestrates Inventory Service (gRPC) for stock checks
 * - Publishes order events to Kafka
 * - Consumes events from other services
 * 
 * Service Architecture:
 * - HTTP Server: Exposes REST API for external clients
 * - Kafka Producer: Publishes order events
 * - Kafka Consumer: Consumes events from other services
 * - gRPC Clients: Calls Payment and Inventory services
 * - In-Memory Store: Stores orders (in production, use a database)
 * 
 * Communication:
 * - Publishes to Kafka: order.created, order.status.updated
 * - Consumes from Kafka: user.created, inventory.updated, payment.processed
 * - gRPC Client: Calls Payment Service and Inventory Service
 */

import express from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { createKafkaProducer } from './utils/kafka';
import { setupGrpcClients } from './utils/grpc';
import { setupKafka } from './kafka';
import { setupRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 5002;

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
 * Order interface
 * 
 * Defines the structure of an order object.
 */
export interface Order {
  id: string;                    // Unique order identifier
  userId: string;                // User who placed the order
  items: OrderItem[];             // Order items
  totalAmount: number;           // Total order amount
  status: OrderStatus;           // Order status
  paymentId?: string;            // Payment ID (if payment processed)
  createdAt: string;             // When order was created
  updatedAt: string;             // When order was last updated
}

/**
 * Order item interface
 */
export interface OrderItem {
  productId: string;             // Product ID
  quantity: number;               // Quantity ordered
  price: number;                  // Price per unit
}

/**
 * Order status enum
 * 
 * Defines possible order states.
 */
export enum OrderStatus {
  PENDING = 'PENDING',           // Order created but not confirmed
  CONFIRMED = 'CONFIRMED',       // Order confirmed (payment processed)
  PROCESSING = 'PROCESSING',     // Order being processed
  COMPLETED = 'COMPLETED',       // Order completed
  CANCELLED = 'CANCELLED',       // Order cancelled
  FAILED = 'FAILED',             // Order failed
}

/**
 * In-memory order store
 * 
 * In production, use a database (PostgreSQL, MongoDB, etc.)
 */
const orders: Map<string, Order> = new Map();

/**
 * Kafka producer instance
 */
let kafkaProducer: ReturnType<typeof createKafkaProducer>;

/**
 * Start the Order Service
 */
async function start() {
  try {
    // Step 1: Connect to Kafka
    kafkaProducer = createKafkaProducer();
    await kafkaProducer.connect();
    log.info('Kafka producer connected');

    // Step 2: Setup gRPC clients
    // This connects to Payment and Inventory services
    await setupGrpcClients();

    // Step 3: Setup Kafka consumers
    // This listens to events from other services
    await setupKafka(orders, kafkaProducer);

    // Step 4: Setup HTTP routes
    setupRoutes(app, orders, kafkaProducer);

    // Step 5: Start HTTP server
    app.listen(PORT, () => {
      log.info(`Order Service running on port ${PORT}`);
      log.info(`Health check: http://localhost:${PORT}/health`);
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

export { orders };


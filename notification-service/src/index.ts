/**
 * Notification Service - Main Entry Point
 * 
 * Sends notifications (email, SMS, push) to users based on events from all other services.
 */

import express from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { createKafkaProducer } from './utils/kafka';
import { setupKafka } from './kafka';
import { setupRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 5005;

// CORS configuration - allow frontend on port 3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
}

export enum NotificationType {
  USER_WELCOME = 'USER_WELCOME',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INVENTORY_LOW = 'INVENTORY_LOW',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

const notifications: Map<string, Notification> = new Map();

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
    kafkaProducer = createKafkaProducer();
    await kafkaProducer.connect();
    log.info('Kafka producer connected');

    await setupKafka(notifications, kafkaProducer);
    setupRoutes(app, notifications);

    app.listen(PORT, () => {
      log.info(`Notification Service running on port ${PORT}`);
      log.info(`Health check: http://localhost:${PORT}/health`);
    });

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

export { notifications };


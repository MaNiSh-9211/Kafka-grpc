/**
 * Kafka Consumer Setup for Payment Service
 * 
 * This service consumes order.created events to process payments asynchronously
 * (in addition to the synchronous gRPC endpoint).
 */

import { log } from './utils/logger';
import { createKafkaConsumer } from './utils/kafka-consumer';
import { Payment, payments } from './index';
import { KafkaProducer } from './utils/kafka';

/**
 * Setup Kafka consumers
 * 
 * @param payments - Payment store
 * @param kafkaProducer - Kafka producer
 */
export async function setupKafka(
  payments: Map<string, Payment>,
  kafkaProducer: KafkaProducer
): Promise<void> {
  const consumer = createKafkaConsumer('payment-service-group');

  try {
    await consumer.connect();
    await consumer.subscribe(['order.created']);

    await consumer.run({
      /**
       * Handle order.created event
       * This is an alternative way to process payments (event-driven)
       * In addition to the synchronous gRPC endpoint
       */
      'order.created': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'order.created',
          event,
          receivedAt: new Date().toISOString(),
          service: 'payment-service',
          producerService: 'order-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift();
        }

        log.info('[PAYMENT-SERVICE] 📨 Received event: order.created', {
          from: 'order-service',
          orderId: event.orderId,
          userId: event.userId,
          totalAmount: event.totalAmount,
          timestamp: eventLog.receivedAt
        });

        // In a real application, you might:
        // - Process payment asynchronously
        // - Send payment confirmation email
        // - Update payment records
        // - Trigger fraud checks
      },
    });

    log.info('Kafka consumers started');
  } catch (error) {
    log.error('Failed to setup Kafka consumers', { error });
    throw error;
  }
}


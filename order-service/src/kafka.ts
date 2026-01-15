/**
 * Kafka Consumer Setup for Order Service
 * 
 * This file sets up Kafka consumers for the Order Service.
 * 
 * Order Service consumes events from other services:
 * - user.created: When a new user is created
 * - inventory.updated: When inventory is updated
 * - payment.processed: When payment is processed
 * 
 * Why consume these events?
 * - user.created: Might want to initialize user order history
 * - inventory.updated: Might want to notify about product availability
 * - payment.processed: Update order status based on payment result
 */

import { log } from './utils/logger';
import { createKafkaConsumer } from './utils/kafka';
import { Order, orders } from './index';
import { KafkaProducer } from './utils/kafka';

/**
 * Setup Kafka consumers
 * 
 * This function:
 * 1. Creates a Kafka consumer
 * 2. Connects to Kafka
 * 3. Subscribes to relevant topics
 * 4. Sets up event handlers
 * 
 * @param orders - Order store
 * @param kafkaProducer - Kafka producer (for publishing events if needed)
 */
export async function setupKafka(
  orders: Map<string, Order>,
  kafkaProducer: KafkaProducer
): Promise<void> {
  // Create consumer with consumer group ID
  // Consumer groups allow multiple instances to share the work
  // All instances with the same group ID share the load
  const consumer = createKafkaConsumer('order-service-group');

  try {
    // Connect to Kafka
    await consumer.connect();
    
    // Subscribe to topics
    // Order Service listens to these topics
    await consumer.subscribe([
      'user.created',        // When a new user is created
      'inventory.updated',   // When inventory is updated
      'payment.processed',   // When payment is processed
    ]);

    // Start consuming messages
    // This sets up handlers for each topic
    await consumer.run({
      /**
       * Handle user.created event
       * 
       * When a new user is created, we might want to:
       * - Initialize user order history
       * - Send welcome email with order history
       * - Set up user preferences
       */
      'user.created': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'user.created',
          event,
          receivedAt: new Date().toISOString(),
          service: 'order-service',
          producerService: 'user-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift(); // Keep only last 100 events
        }

        log.info('[ORDER-SERVICE] 📨 Received event: user.created', {
          from: 'user-service',
          userId: event.userId,
          email: event.email,
          timestamp: eventLog.receivedAt
        });

        // In a real application, you might:
        // - Initialize user order history in database
        // - Send welcome email with order history
        // - Set up user preferences
      },

      /**
       * Handle inventory.updated event
       * 
       * When inventory is updated, we might want to:
       * - Notify users who had out-of-stock items in their cart
       * - Update order status if items become available
       */
      'inventory.updated': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'inventory.updated',
          event,
          receivedAt: new Date().toISOString(),
          service: 'order-service',
          producerService: 'inventory-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift();
        }

        log.info('[ORDER-SERVICE] 📨 Received event: inventory.updated', {
          from: 'inventory-service',
          productId: event.productId,
          quantity: event.quantity,
          timestamp: eventLog.receivedAt
        });

        // In a real application, you might:
        // - Notify users who had out-of-stock items in their cart
        // - Update order status if items become available
      },

      /**
       * Handle payment.processed event
       * 
       * When payment is processed, we update the order status.
       * This is an example of event-driven state updates.
       */
      'payment.processed': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'payment.processed',
          event,
          receivedAt: new Date().toISOString(),
          service: 'order-service',
          producerService: 'payment-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift();
        }

        log.info('[ORDER-SERVICE] 📨 Received event: payment.processed', {
          from: 'payment-service',
          paymentId: event.paymentId,
          orderId: event.orderId,
          status: event.status,
          timestamp: eventLog.receivedAt
        });

        // Update order status based on payment status
        if (event.orderId) {
          const order = orders.get(event.orderId);
          if (order) {
            // If payment completed, update order to PROCESSING
            if (event.status === 'COMPLETED') {
              order.status = 'PROCESSING' as any;
              order.updatedAt = new Date().toISOString();
              orders.set(event.orderId, order);

              log.info('[ORDER-SERVICE] ✅ Order status updated to PROCESSING', {
                orderId: event.orderId,
              });
            } 
            // If payment failed, update order to FAILED
            else if (event.status === 'FAILED') {
              order.status = 'FAILED' as any;
              order.updatedAt = new Date().toISOString();
              orders.set(event.orderId, order);

              log.warn('[ORDER-SERVICE] ❌ Order status updated to FAILED', {
                orderId: event.orderId,
              });
            }
          }
        }
      },
    });

    log.info('Kafka consumers started');
  } catch (error) {
    log.error('Failed to setup Kafka consumers', { error });
    throw error;
  }
}


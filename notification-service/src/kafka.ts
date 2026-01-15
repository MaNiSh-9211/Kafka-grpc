/**
 * Kafka Consumer Setup for Notification Service
 * 
 * This service consumes events from ALL other services and sends notifications.
 * This demonstrates the power of event-driven architecture.
 */

import { log } from './utils/logger';
import { createKafkaConsumer } from './utils/kafka-consumer';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  notifications,
} from './index';
import { KafkaProducer } from './utils/kafka';

/**
 * Send a notification (simulated - in production, integrate with email/SMS/push services)
 */
async function sendNotification(
  notification: Notification,
  kafkaProducer: KafkaProducer
): Promise<void> {
  try {
    log.info('Sending notification', {
      notificationId: notification.id,
      type: notification.type,
      channel: notification.channel,
      userId: notification.userId,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const success = Math.random() > 0.05;

    if (success) {
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date().toISOString();
      notifications.set(notification.id, notification);

      await kafkaProducer.send('notification.sent', {
        type: 'notification.sent',
        notificationId: notification.id,
        userId: notification.userId,
        notificationType: notification.type,
        timestamp: notification.sentAt,
      }, notification.id);
    } else {
      notification.status = NotificationStatus.FAILED;
      notifications.set(notification.id, notification);

      await kafkaProducer.send('notification.failed', {
        type: 'notification.failed',
        notificationId: notification.id,
        userId: notification.userId,
        notificationType: notification.type,
        error: 'Failed to send notification',
        timestamp: new Date().toISOString(),
      }, notification.id);

      throw new Error('Failed to send notification');
    }
  } catch (error) {
    log.error('Error sending notification', {
      notificationId: notification.id,
      error,
    });
    throw error;
  }
}

/**
 * Helper function to log event and add to event log
 */
function logEvent(topic: string, event: any, producerService: string) {
  const eventLog = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    topic,
    event,
    receivedAt: new Date().toISOString(),
    service: 'notification-service',
    producerService
  };
  (global as any).eventLogs.push(eventLog);
  if ((global as any).eventLogs.length > 100) {
    (global as any).eventLogs.shift();
  }
  return eventLog;
}

/**
 * Setup Kafka consumers
 */
export async function setupKafka(
  notifications: Map<string, Notification>,
  kafkaProducer: KafkaProducer
): Promise<void> {
  const consumer = createKafkaConsumer('notification-service-group');

  try {
    await consumer.connect();

    await consumer.subscribe([
      'user.created',
      'order.created',
      'order.status.updated',
      'order.completed',
      'payment.processed',
      'payment.failed',
      'payment.refunded',
      'inventory.updated',
      'inventory.low',
      'inventory.out-of-stock',
    ]);

    await consumer.run({
      'user.created': async (event: any) => {
        const eventLog = logEvent('user.created', event, 'user-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: user.created', {
          from: 'user-service',
          userId: event.userId,
          timestamp: eventLog.receivedAt
        });

        const notification: Notification = {
          id: uuidv4(),
          userId: event.userId,
          type: NotificationType.USER_WELCOME,
          channel: NotificationChannel.EMAIL,
          subject: 'Welcome to our platform!',
          message: `Hi ${event.name}, welcome to our platform!`,
          status: NotificationStatus.PENDING,
          createdAt: new Date().toISOString(),
        };

        notifications.set(notification.id, notification);
        await sendNotification(notification, kafkaProducer);
      },

      'order.created': async (event: any) => {
        const eventLog = logEvent('order.created', event, 'order-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: order.created', {
          from: 'order-service',
          orderId: event.orderId,
          timestamp: eventLog.receivedAt
        });

        const notification: Notification = {
          id: uuidv4(),
          userId: event.userId,
          type: NotificationType.ORDER_CONFIRMED,
          channel: NotificationChannel.EMAIL,
          subject: 'Order Confirmed',
          message: `Your order #${event.orderId} has been confirmed. Total: $${event.totalAmount}`,
          status: NotificationStatus.PENDING,
          createdAt: new Date().toISOString(),
        };

        notifications.set(notification.id, notification);
        await sendNotification(notification, kafkaProducer);
      },

      'order.status.updated': async (event: any) => {
        const eventLog = logEvent('order.status.updated', event, 'order-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: order.status.updated', {
          from: 'order-service',
          orderId: event.orderId,
          status: event.status,
          timestamp: eventLog.receivedAt
        });

        const notification: Notification = {
          id: uuidv4(),
          userId: event.userId,
          type: NotificationType.ORDER_STATUS_UPDATE,
          channel: NotificationChannel.EMAIL,
          subject: 'Order Status Updated',
          message: `Your order #${event.orderId} status has been updated to ${event.status}`,
          status: NotificationStatus.PENDING,
          createdAt: new Date().toISOString(),
        };

        notifications.set(notification.id, notification);
        await sendNotification(notification, kafkaProducer);
      },

      'order.completed': async (event: any) => {
        const eventLog = logEvent('order.completed', event, 'order-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: order.completed', {
          from: 'order-service',
          orderId: event.orderId,
          timestamp: eventLog.receivedAt
        });

        const notification: Notification = {
          id: uuidv4(),
          userId: event.userId,
          type: NotificationType.ORDER_COMPLETED,
          channel: NotificationChannel.EMAIL,
          subject: 'Order Completed',
          message: `Your order #${event.orderId} has been completed. Thank you!`,
          status: NotificationStatus.PENDING,
          createdAt: new Date().toISOString(),
        };

        notifications.set(notification.id, notification);
        await sendNotification(notification, kafkaProducer);
      },

      'payment.processed': async (event: any) => {
        const eventLog = logEvent('payment.processed', event, 'payment-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: payment.processed', {
          from: 'payment-service',
          paymentId: event.paymentId,
          status: event.status,
          timestamp: eventLog.receivedAt
        });

        if (event.status === 'COMPLETED') {
          const notification: Notification = {
            id: uuidv4(),
            userId: event.userId,
            type: NotificationType.PAYMENT_SUCCESS,
            channel: NotificationChannel.EMAIL,
            subject: 'Payment Successful',
            message: `Your payment of $${event.amount} has been processed successfully.`,
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
          };

          notifications.set(notification.id, notification);
          await sendNotification(notification, kafkaProducer);
        } else if (event.status === 'FAILED') {
          const notification: Notification = {
            id: uuidv4(),
            userId: event.userId,
            type: NotificationType.PAYMENT_FAILED,
            channel: NotificationChannel.EMAIL,
            subject: 'Payment Failed',
            message: `Your payment of $${event.amount} could not be processed. Please try again.`,
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
          };

          notifications.set(notification.id, notification);
          await sendNotification(notification, kafkaProducer);
        }
      },

      'inventory.low': async (event: any) => {
        const eventLog = logEvent('inventory.low', event, 'inventory-service');
        log.info('[NOTIFICATION-SERVICE] 📨 Received event: inventory.low', {
          from: 'inventory-service',
          productId: event.productId,
          availableQuantity: event.availableQuantity,
          timestamp: eventLog.receivedAt
        });

        const notification: Notification = {
          id: uuidv4(),
          userId: 'admin',
          type: NotificationType.INVENTORY_LOW,
          channel: NotificationChannel.EMAIL,
          subject: 'Low Stock Alert',
          message: `Product ${event.productId} is running low. Only ${event.availableQuantity} units remaining.`,
          status: NotificationStatus.PENDING,
          createdAt: new Date().toISOString(),
        };

        notifications.set(notification.id, notification);
        await sendNotification(notification, kafkaProducer);
      },
    });

    log.info('Kafka consumers started - listening to all service events');
  } catch (error) {
    log.error('Failed to setup Kafka consumers', { error });
    throw error;
  }
}


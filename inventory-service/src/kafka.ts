/**
 * Kafka Consumer Setup for Inventory Service
 * 
 * Consumes order events to manage inventory automatically.
 */

import { log } from './utils/logger';
import { createKafkaConsumer } from './utils/kafka-consumer';
import { Product } from './models/Product';
import { Reservation } from './models/Reservation';
import { KafkaProducer } from './utils/kafka';

export async function setupKafka(
  kafkaProducer: KafkaProducer
): Promise<void> {
  const consumer = createKafkaConsumer('inventory-service-group');

  try {
    await consumer.connect();
    await consumer.subscribe(['order.created', 'order.cancelled']);

    await consumer.run({
      'order.created': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'order.created',
          event,
          receivedAt: new Date().toISOString(),
          service: 'inventory-service',
          producerService: 'order-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift();
        }

        log.info('[INVENTORY-SERVICE] 📨 Received event: order.created', {
          from: 'order-service',
          orderId: event.orderId,
          items: event.items,
          timestamp: eventLog.receivedAt
        });
      },

      'order.cancelled': async (event: any) => {
        const eventLog = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic: 'order.cancelled',
          event,
          receivedAt: new Date().toISOString(),
          service: 'inventory-service',
          producerService: 'order-service'
        };
        (global as any).eventLogs.push(eventLog);
        if ((global as any).eventLogs.length > 100) {
          (global as any).eventLogs.shift();
        }

        log.info('[INVENTORY-SERVICE] 📨 Received event: order.cancelled', {
          from: 'order-service',
          orderId: event.orderId,
          timestamp: eventLog.receivedAt
        });

        const orderReservations = await Reservation.find({ 
          orderId: event.orderId,
          status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        for (const reservation of orderReservations) {
          const product = await Product.findOne({ id: reservation.productId });
          if (product) {
            product.availableQuantity += reservation.quantity;
            product.reservedQuantity -= reservation.quantity;
            await product.save();

            await kafkaProducer.send('inventory.updated', {
              type: 'inventory.updated',
              productId: reservation.productId,
              quantity: product.totalQuantity - product.reservedQuantity,
              availableQuantity: product.availableQuantity,
              reservedQuantity: product.reservedQuantity,
              timestamp: product.updatedAt.toISOString(),
            }, reservation.productId);
          }

          reservation.status = 'RELEASED';
          await reservation.save();
        }

        log.info('Inventory released for cancelled order', {
          orderId: event.orderId,
          reservationsReleased: orderReservations.length,
        });
      },
    });

    log.info('Kafka consumers started');
  } catch (error) {
    log.error('Failed to setup Kafka consumers', { error });
    throw error;
  }
}


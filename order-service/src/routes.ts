/**
 * HTTP Routes for Order Service
 * 
 * This file defines all HTTP endpoints (REST API) for the Order Service.
 * 
 * Order Service demonstrates the orchestration pattern:
 * - It coordinates multiple services (Payment, Inventory) to create an order
 * - Uses gRPC for synchronous calls (need immediate responses)
 * - Uses Kafka for asynchronous events (publish order events)
 * 
 * This is a Saga pattern - a distributed transaction pattern where:
 * - Multiple steps must complete successfully
 * - If any step fails, previous steps must be rolled back
 */

import { Express, Request, Response } from 'express';
import { log } from './utils/logger';
import { KafkaProducer } from './utils/kafka';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatus } from './index';
import { processPayment, checkStock, reserveInventory } from './utils/grpc';

/**
 * Setup all HTTP routes for the Order Service
 * 
 * @param app - Express application instance
 * @param orders - In-memory order store (Map of orderId -> Order)
 * @param kafkaProducer - Kafka producer for publishing events
 */
export function setupRoutes(
  app: Express,
  orders: Map<string, Order>,
  kafkaProducer: KafkaProducer
): void {
  /**
   * Event Log Endpoint
   * GET /events
   */
  app.get('/events', (req: Request, res: Response) => {
    res.json({
      service: 'order-service',
      data: (global as any).eventLogs || []
    });
  });

  /**
   * Health Check Endpoint
   * GET /health
   */
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy', 
      service: 'order-service',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Create Order Endpoint
   * POST /orders
   * 
   * This is the most complex endpoint - it orchestrates multiple services.
   * 
   * Flow (Saga Pattern):
   * 1. Validate input
   * 2. Calculate total amount
   * 3. Check inventory (gRPC → Inventory Service) - synchronous
   * 4. Reserve inventory (gRPC → Inventory Service) - synchronous
   * 5. Process payment (gRPC → Payment Service) - synchronous
   * 6. Create order
   * 7. Publish 'order.created' event (Kafka) - asynchronous
   * 
   * If any step fails, we should rollback previous steps.
   * In production, implement proper saga orchestration with compensation.
   */
  app.post('/orders', async (req: Request, res: Response) => {
    try {
      // Extract order data from request body
      const { userId, items } = req.body;

      // Step 1: Validate input
      // Always validate input to prevent bad data
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          service: 'order-service',
          error: 'UserId and items are required',
        });
      }

      // Step 2: Calculate total amount
      // Sum up all item prices * quantities
      const totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Step 3: Check inventory for all items (gRPC - synchronous)
      // We need to check BEFORE reserving to avoid reserving unavailable items
      // This is a synchronous call - we wait for the response
      for (const item of items) {
        // Call Inventory Service via gRPC
        // This is a blocking call - we wait for the response
        const stockCheck = await checkStock(item.productId, item.quantity);
        
        // If product is out of stock, return error immediately
        if (!stockCheck.inStock) {
          return res.status(400).json({
            service: 'order-service',
            error: `Product ${item.productId} is out of stock`,
          });
        }
      }

      // Step 4: Reserve inventory for all items (gRPC - synchronous)
      // Now that we know items are in stock, we reserve them
      // This prevents other orders from taking the same inventory
      const reservationIds: string[] = [];
      try {
        for (const item of items) {
          // Reserve inventory for this item
          // Returns a reservation ID that we'll use later
          const reservationId = await reserveInventory(
            'temp-order-id',  // Temporary order ID (will be replaced)
            item.productId,
            item.quantity
          );
          reservationIds.push(reservationId);
        }
      } catch (error) {
        // If reservation fails, we should rollback
        // In production, implement proper rollback mechanism
        log.error('Failed to reserve inventory, rolling back', { error });
        return res.status(500).json({
          service: 'order-service',
          error: 'Failed to reserve inventory',
        });
      }

      // Step 5: Process payment (gRPC - synchronous)
      // Now that inventory is reserved, we process the payment
      // This is a synchronous call - we need the payment result before proceeding
      let paymentId: string;
      try {
        // Call Payment Service via gRPC
        const paymentResult = await processPayment(
          'temp-order-id',
          userId,
          totalAmount,
          'USD'
        );
        paymentId = paymentResult.paymentId;
      } catch (error) {
        // If payment fails, we should:
        // 1. Release inventory reservations
        // 2. Return error to client
        // In production, implement proper rollback
        log.error('Payment failed, rolling back inventory', { error });
        return res.status(500).json({
          service: 'order-service',
          error: 'Payment processing failed',
        });
      }

      // Step 6: Create order
      // All prerequisites are met, so we create the order
      const order: Order = {
        id: uuidv4(),              // Generate unique order ID
        userId,
        items,
        totalAmount,
        status: OrderStatus.CONFIRMED,  // Order is confirmed
        paymentId,                 // Link to payment
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store order in memory
      // In production: await db.orders.insert(order)
      orders.set(order.id, order);

      // Step 7: Publish event to Kafka (asynchronous)
      // This notifies other services about the new order
      // Other services can react to this event (e.g., send confirmation email)
      await kafkaProducer.send('order.created', {
        type: 'order.created',
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        items: order.items,
        paymentId: order.paymentId,
        timestamp: order.createdAt,
      }, order.id);  // Use order ID as partition key

      // Log successful order creation
      log.info('Order created', {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
      });

      // Return created order
      res.status(201).json({
        service: 'order-service',
        data: order
      });
    } catch (error) {
      // Catch any unexpected errors
      log.error('Error creating order', { error });
      res.status(500).json({ 
        service: 'order-service',
        error: 'Internal server error' 
      });
    }
  });

  /**
   * Get Order by ID Endpoint
   * GET /orders/:id
   */
  app.get('/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = orders.get(id);

    if (!order) {
      return res.status(404).json({ 
        service: 'order-service',
        error: 'Order not found' 
      });
    }

    res.json({
      service: 'order-service',
      data: order
    });
  });

  /**
   * Get All Orders Endpoint
   * GET /orders
   */
  app.get('/orders', (req: Request, res: Response) => {
    const allOrders = Array.from(orders.values());
    res.json({
      service: 'order-service',
      data: allOrders
    });
  });

  /**
   * Update Order Status Endpoint
   * PUT /orders/:id/status
   * 
   * Publishes 'order.status.updated' event to Kafka
   */
  app.put('/orders/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = orders.get(id);
      if (!order) {
        return res.status(404).json({ 
          service: 'order-service',
          error: 'Order not found' 
        });
      }

      // Validate status
      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ 
          service: 'order-service',
          error: 'Invalid status' 
        });
      }

      // Update order status
      order.status = status;
      order.updatedAt = new Date().toISOString();
      orders.set(id, order);

      // Publish status update event
      await kafkaProducer.send('order.status.updated', {
        type: 'order.status.updated',
        orderId: order.id,
        userId: order.userId,
        status: order.status,
        timestamp: order.updatedAt,
      }, order.id);

      log.info('Order status updated', { 
        orderId: id, 
        status 
      });

      res.json({
        service: 'order-service',
        data: order
      });
    } catch (error) {
      log.error('Error updating order status', { error });
      res.status(500).json({ 
        service: 'order-service',
        error: 'Internal server error' 
      });
    }
  });
}


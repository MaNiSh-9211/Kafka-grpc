/**
 * HTTP Routes for Payment Service
 * 
 * Provides REST API endpoints for payment management.
 * Note: The main payment processing is done via gRPC, but we expose
 * REST endpoints for external clients and monitoring.
 */

import { Express, Request, Response } from 'express';
import { log } from './utils/logger';
import { KafkaProducer } from './utils/kafka';
import { Payment, payments } from './index';

/**
 * Setup all HTTP routes
 */
export function setupRoutes(
  app: Express,
  payments: Map<string, Payment>,
  kafkaProducer: KafkaProducer
): void {
  /**
   * Event Log Endpoint
   */
  app.get('/events', (req: Request, res: Response) => {
    res.json({
      service: 'payment-service',
      data: (global as any).eventLogs || []
    });
  });

  /**
   * Health check endpoint
   */
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy', 
      service: 'payment-service',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  app.get('/payments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = payments.get(id);

    if (!payment) {
      return res.status(404).json({ 
        service: 'payment-service',
        error: 'Payment not found' 
      });
    }

    res.json({
      service: 'payment-service',
      data: payment
    });
  });

  /**
   * Get all payments
   * GET /payments
   */
  app.get('/payments', (req: Request, res: Response) => {
    const allPayments = Array.from(payments.values());
    res.json({
      service: 'payment-service',
      data: allPayments
    });
  });
}


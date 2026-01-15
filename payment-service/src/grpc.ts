/**
 * gRPC Server Setup for Payment Service
 * 
 * This file sets up the gRPC server that exposes payment processing endpoints.
 * Other services (like Order Service) call these endpoints synchronously.
 * 
 * Why gRPC Server here?
 * - Order Service needs immediate payment confirmation
 * - High performance for inter-service communication
 * - Strong typing with Protocol Buffers
 */

import * as grpc from '@grpc/grpc-js';
import { log } from './utils/logger';
import { loadProto, createServer } from './utils/grpc';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus, payments } from './index';
import { KafkaProducer } from './utils/kafka';

let grpcServer: grpc.Server | null = null;

/**
 * Setup gRPC server with payment service handlers
 * 
 * This function:
 * 1. Loads the payment.proto file
 * 2. Creates a gRPC server
 * 3. Implements the PaymentService methods
 * 4. Starts the server
 * 
 * @param payments - Payment store (Map of paymentId -> Payment)
 * @param kafkaProducer - Kafka producer for publishing events
 */
export async function setupGrpcServer(
  payments: Map<string, Payment>,
  kafkaProducer: KafkaProducer
): Promise<void> {
  try {
    // Load proto definition
    // This loads the payment.proto file from the proto/ directory
    const PaymentService = loadProto(
      join(__dirname, '../proto/payment.proto'),
      'payment'
    );

    // Create gRPC server
    grpcServer = createServer();

    // Implement PaymentService methods
    // These are the RPC methods that other services can call
    grpcServer.addService(PaymentService.PaymentService.service, {
      /**
       * ProcessPayment - Process a payment request
       * 
       * This is called by Order Service when creating an order.
       * It's a unary RPC (request/response).
       * 
       * @param call - gRPC call object containing the request
       * @param callback - Callback function to send the response
       */
      processPayment: async (call: any, callback: any) => {
        try {
          // Extract request data
          const { orderId, userId, amount, currency, paymentMethod, cardNumber } = call.request;

          log.info('Processing payment via gRPC', {
            orderId,
            userId,
            amount,
            currency,
          });

          // Simulate payment processing
          // In production, this would integrate with a payment gateway (Stripe, PayPal, etc.)
          // For demo purposes, we randomly succeed or fail (90% success rate)
          const success = Math.random() > 0.1;

          // Create payment record
          const payment: Payment = {
            id: uuidv4(),                    // Generate unique payment ID
            orderId,
            userId,
            amount,
            currency: currency || 'USD',
            status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            paymentMethod: paymentMethod === 0 ? 'CREDIT_CARD' : 'OTHER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Store payment
          payments.set(payment.id, payment);

          // Publish event to Kafka (asynchronous)
          // This notifies other services about the payment result
          await kafkaProducer.send('payment.processed', {
            type: 'payment.processed',
            paymentId: payment.id,
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount,
            status: payment.status,
            timestamp: payment.createdAt,
          }, payment.id);

          // Return response to caller
          // callback(null, response) means success
          // callback(error) means failure
          callback(null, {
            paymentId: payment.id,
            status: success ? 2 : 3,  // COMPLETED = 2, FAILED = 3 (from proto enum)
            message: success ? 'Payment processed successfully' : 'Payment processing failed',
            timestamp: Date.now(),
          });

          log.info('Payment processed', {
            paymentId: payment.id,
            status: payment.status,
          });
        } catch (error) {
          // Handle errors
          log.error('Error processing payment', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * RefundPayment - Refund a payment
       * 
       * This allows refunding a completed payment.
       */
      refundPayment: async (call: any, callback: any) => {
        try {
          const { paymentId, amount, reason } = call.request;

          // Find payment
          const payment = payments.get(paymentId);
          if (!payment) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Payment not found',
            });
          }

          // Check if payment can be refunded
          if (payment.status !== PaymentStatus.COMPLETED) {
            return callback({
              code: grpc.status.FAILED_PRECONDITION,
              message: 'Payment cannot be refunded',
            });
          }

          // Update payment status
          payment.status = PaymentStatus.REFUNDED;
          payment.updatedAt = new Date().toISOString();
          payments.set(paymentId, payment);

          // Publish refund event
          await kafkaProducer.send('payment.refunded', {
            type: 'payment.refunded',
            paymentId,
            orderId: payment.orderId,
            amount,
            reason,
            timestamp: new Date().toISOString(),
          }, paymentId);

          callback(null, {
            refundId: uuidv4(),
            success: true,
            message: 'Payment refunded successfully',
          });

          log.info('Payment refunded', { paymentId, amount });
        } catch (error) {
          log.error('Error refunding payment', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * GetPaymentStatus - Get payment status
       * 
       * This allows querying the status of a payment.
       */
      getPaymentStatus: async (call: any, callback: any) => {
        try {
          const { paymentId } = call.request;

          const payment = payments.get(paymentId);
          if (!payment) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Payment not found',
            });
          }

          // Map PaymentStatus enum to proto enum
          const statusMap: Record<string, number> = {
            PENDING: 0,
            PROCESSING: 1,
            COMPLETED: 2,
            FAILED: 3,
            REFUNDED: 4,
          };

          callback(null, {
            paymentId: payment.id,
            status: statusMap[payment.status] || 0,
            amount: payment.amount,
            timestamp: new Date(payment.createdAt).getTime(),
          });
        } catch (error) {
          log.error('Error getting payment status', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },
    });

    // Start gRPC server
    // This makes the server listen for incoming gRPC calls
    const grpcPort = process.env.GRPC_PORT || 50031;
    grpcServer.bindAsync(
      `0.0.0.0:${grpcPort}`,  // Listen on all network interfaces
      grpc.ServerCredentials.createInsecure(),  // No TLS (use createSsl() in production)
      (error, port) => {
        if (error) {
          log.error('Failed to start gRPC server', { error });
          throw error;
        }
        grpcServer!.start();  // Start the server
        log.info(`Payment Service gRPC server running on port ${port}`);
      }
    );
  } catch (error) {
    log.error('Failed to setup gRPC server', { error });
    throw error;
  }
}


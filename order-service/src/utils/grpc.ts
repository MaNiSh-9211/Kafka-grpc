/**
 * gRPC Client Utility for Order Service
 * 
 * This file provides utilities for creating gRPC clients.
 * Order Service acts as a gRPC CLIENT, making calls to:
 * - Payment Service: To process payments
 * - Inventory Service: To check stock and reserve inventory
 * 
 * What is gRPC?
 * - High-performance RPC framework
 * - Uses Protocol Buffers for message serialization (binary, faster than JSON)
 * - Uses HTTP/2 for transport (multiplexing, header compression)
 * - Provides strong typing with generated code
 * 
 * Why gRPC for these calls?
 * - We need immediate responses (can't proceed without payment confirmation)
 * - High performance (binary protocol, HTTP/2)
 * - Strong typing with Protocol Buffers
 * - Better than REST for inter-service communication
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { log } from './logger';
import { join } from 'path';

/**
 * Load a Protocol Buffer definition file
 * 
 * Protocol Buffers define the service contract and message types.
 * This function loads and parses the .proto file.
 * 
 * @param protoPath - Path to the .proto file
 * @param packageName - Package name in the proto file
 * @returns Loaded package definition
 */
function loadProto(protoPath: string, packageName: string): any {
  try {
    // Load proto file with options
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,        // Keep field names as-is (don't convert to camelCase)
      longs: String,         // Convert 64-bit integers to strings (JavaScript limitation)
      enums: String,         // Convert enums to strings
      defaults: true,         // Use default values for missing fields
      oneofs: true,          // Handle oneof fields
    });

    // Load the package definition into gRPC
    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    
    // Return the specific package (e.g., 'payment' or 'inventory')
    return proto[packageName];
  } catch (error) {
    log.error('Failed to load proto file', { protoPath, error });
    throw error;
  }
}

/**
 * Create a gRPC client for a service
 * 
 * This creates a client that can call methods on a gRPC server.
 * 
 * @param ServiceClient - The service client class from proto
 * @param address - Server address (host:port)
 * @param options - Optional gRPC channel options
 * @returns gRPC client instance
 */
function createClient(
  ServiceClient: any,
  address: string,
  options?: grpc.ChannelOptions
): any {
  // Default channel options
  // These configure the connection behavior
  const defaultOptions: grpc.ChannelOptions = {
    'grpc.keepalive_time_ms': 30000,        // Send keepalive ping every 30 seconds
    'grpc.keepalive_timeout_ms': 5000,      // Wait 5 seconds for keepalive ack
    'grpc.http2.max_pings_without_data': 0,       // No limit on pings
    'grpc.http2.min_time_between_pings_ms': 10000, // Minimum 10 seconds between pings
    'grpc.http2.min_ping_interval_without_data_ms': 300000, // 5 minutes
    ...options,  // Override with provided options
  };

  // Create client with insecure credentials (no TLS)
  // In production, use createSsl() for encrypted connections
  const client = new ServiceClient(
    address,
    grpc.credentials.createInsecure(),
    defaultOptions
  );

  log.info('gRPC client created', { address });
  return client;
}

/**
 * Promisify a gRPC unary call
 * 
 * gRPC methods use callbacks by default (error, response).
 * This function converts them to Promises for easier async/await usage.
 * 
 * @param method - gRPC client method (bound to client)
 * @returns Promise-based version of the method
 */
function promisify<TRequest, TResponse>(
  method: (request: TRequest, callback: (error: any, response: TResponse) => void) => void
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      // Call the gRPC method
      method(request, (error: any, response: TResponse) => {
        if (error) {
          // Log error with details
          log.error('gRPC call failed', { 
            error: error.message, 
            code: error.code 
          });
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}

// Payment Service client (will be initialized in setupGrpcClients)
export let paymentClient: any = null;

// Inventory Service client (will be initialized in setupGrpcClients)
export let inventoryClient: any = null;

/**
 * Setup gRPC clients for Payment and Inventory services
 * 
 * This function:
 * 1. Loads the proto files
 * 2. Creates clients for both services
 * 3. Stores them in module-level variables
 * 
 * Must be called before making any gRPC calls.
 */
export async function setupGrpcClients(): Promise<void> {
  try {
    // Load Payment Service proto
    // This loads the payment.proto file and parses it
    const PaymentService = loadProto(
      join(__dirname, '../../proto/payment.proto'),
      'payment'
    );

    // Create Payment Service client
    // This connects to the Payment Service gRPC server
    paymentClient = createClient(
      PaymentService.PaymentService,  // Service class from proto
      process.env.PAYMENT_SERVICE_URL || 'localhost:5003'  // Server address
    );

    log.info('Payment Service gRPC client connected');

    // Load Inventory Service proto
    const InventoryService = loadProto(
      join(__dirname, '../../proto/inventory.proto'),
      'inventory'
    );

    // Create Inventory Service client
    inventoryClient = createClient(
      InventoryService.InventoryService,
      process.env.INVENTORY_SERVICE_URL || 'localhost:5004'
    );

    log.info('Inventory Service gRPC client connected');
  } catch (error) {
    log.error('Failed to setup gRPC clients', { error });
    throw error;
  }
}

/**
 * Process payment via Payment Service (gRPC)
 * 
 * This function calls the Payment Service to process a payment.
 * 
 * @param orderId - Order ID
 * @param userId - User ID
 * @param amount - Payment amount
 * @param currency - Currency code (default: USD)
 * @returns Payment ID and status
 * 
 * @throws Error if payment client is not initialized or call fails
 */
export async function processPayment(
  orderId: string,
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<{ paymentId: string; status: string }> {
  // Check if client is initialized
  if (!paymentClient) {
    throw new Error('Payment client not initialized');
  }

  try {
    // Promisify the processPayment method
    // This converts the callback-based method to a Promise
    const processPaymentMethod = promisify(
      paymentClient.processPayment.bind(paymentClient)
    );

    // Call the Payment Service
    // This is a synchronous RPC call - we wait for the response
    const response: any = await processPaymentMethod({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod: 0,  // CREDIT_CARD (enum value from proto)
      cardNumber: '****1234',  // In production, this would be encrypted
    });

    // Log successful payment
    log.info('Payment processed via gRPC', {
      orderId,
      paymentId: response.paymentId,
      status: response.status,
    });

    // Return payment ID and status
    return {
      paymentId: response.paymentId,
      status: response.message,
    };
  } catch (error) {
    // Log error with context
    log.error('Error processing payment', {
      orderId,
      userId,
      amount,
      error,
    });
    
    // Rethrow so caller can handle it
    throw error;
  }
}

/**
 * Check inventory stock via Inventory Service (gRPC)
 * 
 * This function calls the Inventory Service to check if a product is in stock.
 * 
 * @param productId - Product ID
 * @param quantity - Required quantity
 * @returns Stock availability information
 */
export async function checkStock(
  productId: string,
  quantity: number
): Promise<{ inStock: boolean; availableQuantity: number }> {
  if (!inventoryClient) {
    throw new Error('Inventory client not initialized');
  }

  try {
    // Promisify the checkStock method
    const checkStockMethod = promisify(
      inventoryClient.checkStock.bind(inventoryClient)
    );

    // Call the Inventory Service
    const response: any = await checkStockMethod({
      productId,
      quantity,
    });

    // Log at debug level (not info, to avoid spam)
    log.debug('Stock checked via gRPC', {
      productId,
      quantity,
      inStock: response.inStock,
      availableQuantity: response.availableQuantity,
    });

    // Return stock information
    return {
      inStock: response.inStock,
      availableQuantity: response.availableQuantity,
    };
  } catch (error) {
    // Log error
    log.error('Error checking stock', {
      productId,
      quantity,
      error,
    });
    
    // Rethrow
    throw error;
  }
}

/**
 * Reserve inventory via Inventory Service (gRPC)
 * 
 * This function calls the Inventory Service to reserve inventory for an order.
 * 
 * @param orderId - Order ID
 * @param productId - Product ID
 * @param quantity - Quantity to reserve
 * @returns Reservation ID
 */
export async function reserveInventory(
  orderId: string,
  productId: string,
  quantity: number
): Promise<string> {
  if (!inventoryClient) {
    throw new Error('Inventory client not initialized');
  }

  try {
    // Promisify the reserveInventory method
    const reserveInventoryMethod = promisify(
      inventoryClient.reserveInventory.bind(inventoryClient)
    );

    // Call the Inventory Service
    const response: any = await reserveInventoryMethod({
      orderId,
      productId,
      quantity,
    });

    // Check if reservation was successful
    if (!response.success) {
      throw new Error(response.message || 'Failed to reserve inventory');
    }

    // Log successful reservation
    log.info('Inventory reserved via gRPC', {
      orderId,
      productId,
      quantity,
      reservationId: response.reservationId,
    });

    // Return reservation ID
    return response.reservationId;
  } catch (error) {
    // Log error
    log.error('Error reserving inventory', {
      orderId,
      productId,
      quantity,
      error,
    });
    
    // Rethrow
    throw error;
  }
}


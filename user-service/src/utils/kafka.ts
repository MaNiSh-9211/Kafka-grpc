/**
 * Kafka Producer Utility
 * 
 * This file provides a Kafka producer for publishing events to Kafka topics.
 * 
 * What is Kafka?
 * - Kafka is a distributed event streaming platform
 * - Topics are named channels where events are published
 * - Producers publish events to topics
 * - Consumers subscribe to topics and process events
 * 
 * Why use Kafka?
 * - Decouples services (services don't need to know about each other)
 * - Scalable (can handle millions of messages per second)
 * - Reliable (messages are persisted and can be replayed)
 * - Allows multiple consumers to process the same event
 */

import { Kafka, Producer, KafkaConfig, logLevel } from 'kafkajs';
import { log } from './logger';

/**
 * Kafka configuration
 * 
 * This configures how the service connects to Kafka.
 * In production, these values should come from environment variables.
 */
const kafkaConfig: KafkaConfig = {
  // Client ID - unique identifier for this Kafka client
  // Used by Kafka for logging and metrics
  clientId: process.env.KAFKA_CLIENT_ID || 'user-service-client',
  
  // Kafka broker addresses
  // Can be a single broker or multiple (for high availability)
  // Format: 'host:port'
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  
  // Log level for Kafka client
  // INFO level logs connection events, errors, etc.
  logLevel: logLevel.INFO,
  
  // Retry configuration
  // If a request fails, KafkaJS will retry automatically
  retry: {
    initialRetryTime: 100,    // Initial delay before retry (100ms)
    retries: 8,                // Maximum number of retries
    maxRetryTime: 30000,       // Maximum delay between retries (30 seconds)
    multiplier: 2,            // Multiply delay by 2 for each retry (exponential backoff)
  },
  
  // Connection timeout - how long to wait when connecting to broker
  connectionTimeout: 3000,  // 3 seconds
  
  // Request timeout - how long to wait for a response
  requestTimeout: 30000,    // 30 seconds
};

// Create Kafka instance
// This is the main Kafka client that we'll use to create producers/consumers
const kafka = new Kafka(kafkaConfig);

/**
 * Kafka Producer Class
 * 
 * This class handles publishing events to Kafka topics.
 * 
 * Key concepts:
 * - Producer: Publishes messages to topics
 * - Topic: Named channel where messages are published
 * - Partition: Topics are divided into partitions for parallelism
 * - Key: Optional key that determines which partition the message goes to
 * 
 * Usage:
 * ```typescript
 * const producer = createKafkaProducer();
 * await producer.connect();
 * await producer.send('user.created', { userId: '123' }, 'user-123');
 * ```
 */
export class KafkaProducer {
  // Internal KafkaJS producer instance
  private producer: Producer;
  
  // Track connection status
  private isConnected: boolean = false;

  constructor() {
    // Create producer with idempotent writes
    // Idempotent means: sending the same message multiple times results in only one message
    // This prevents duplicate messages if there's a network error and we retry
    this.producer = kafka.producer({
      idempotent: true,              // Enable idempotent writes
      maxInFlightRequests: 1,        // Required for idempotent producer (only 1 request at a time)
      transactionTimeout: 30000,     // Timeout for transactions
    });
  }

  /**
   * Connect to Kafka broker
   * 
   * This must be called before sending any messages.
   * It establishes a connection to the Kafka broker.
   * 
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    try {
      // Connect to Kafka broker
      // This establishes a network connection
      await this.producer.connect();
      
      // Mark as connected
      this.isConnected = true;
      
      // Log successful connection
      log.info('Kafka producer connected', {
        brokers: kafkaConfig.brokers,
      });
    } catch (error) {
      // Log error and rethrow
      // This allows the service to handle the error (e.g., retry, exit)
      log.error('Failed to connect Kafka producer', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka broker
   * 
   * This should be called during graceful shutdown.
   * It closes the connection and ensures all pending messages are sent.
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect from Kafka
      // This closes the connection gracefully
      await this.producer.disconnect();
      
      // Mark as disconnected
      this.isConnected = false;
      
      log.info('Kafka producer disconnected');
    } catch (error) {
      // Log error but don't throw (we're shutting down anyway)
      log.error('Error disconnecting Kafka producer', { error });
    }
  }

  /**
   * Send a message to a Kafka topic
   * 
   * This publishes an event to a Kafka topic.
   * Other services can subscribe to this topic and react to the event.
   * 
   * @param topic - The topic name (e.g., 'user.created')
   * @param event - The event data (will be serialized to JSON)
   * @param key - Optional partition key
   *                Messages with the same key go to the same partition
   *                This ensures ordering for related messages
   *                Example: Use userId as key so all events for a user go to same partition
   * @param headers - Optional message headers for metadata
   * 
   * @throws Error if producer is not connected or send fails
   * 
   * Example:
   * ```typescript
   * await producer.send('user.created', {
   *   type: 'user.created',
   *   userId: '123',
   *   email: 'user@example.com'
   * }, 'user-123');
   * ```
   */
  async send(
    topic: string,
    event: any,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    // Check if producer is connected
    // This prevents errors if we try to send before connecting
    if (!this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }

    try {
      // Serialize event to JSON
      // Kafka stores messages as byte arrays, so we convert our object to JSON string
      const value = JSON.stringify(event);

      // Send message to Kafka topic
      // This is an asynchronous operation - it returns a Promise
      await this.producer.send({
        topic,  // Topic name
        messages: [
          {
            key: key || null,        // Partition key (null = random partition)
            value,                   // Message value (JSON string)
            headers: {
              'content-type': 'application/json',  // Indicate it's JSON
              'timestamp': new Date().toISOString(), // When message was created
              ...headers,            // Any additional headers
            },
          },
        ],
      });

      // Log successful send (at debug level to avoid spam)
      log.debug('Message sent to Kafka', {
        topic,
        key,
        eventType: event.type || 'unknown',
      });
    } catch (error) {
      // Log error with context
      // This helps with debugging - we can see what topic and event failed
      log.error('Failed to send message to Kafka', {
        topic,
        error,
        event,
      });
      
      // Rethrow error so caller can handle it
      throw error;
    }
  }
}

/**
 * Create and return a Kafka producer instance
 * 
 * This is a factory function that creates a new producer.
 * We use a function instead of exporting the class directly
 * to allow for future configuration or initialization logic.
 * 
 * @returns New KafkaProducer instance
 */
export function createKafkaProducer(): KafkaProducer {
  return new KafkaProducer();
}


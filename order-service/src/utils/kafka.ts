/**
 * Kafka Producer and Consumer Utility for Order Service
 * 
 * This file provides Kafka producer and consumer functionality.
 * See user-service/src/utils/kafka.ts for producer explanation.
 * 
 * Order Service uses:
 * - Producer: To publish order events
 * - Consumer: To consume events from other services
 */

import { Kafka, Producer, Consumer, KafkaConfig, EachMessagePayload, logLevel } from 'kafkajs';
import { log } from './logger';

// Kafka configuration
const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'order-service-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
  },
  connectionTimeout: 10000,  // 10 seconds (increased for Docker startup)
  requestTimeout: 30000,
};

const kafka = new Kafka(kafkaConfig);

/**
 * Kafka Producer Class
 * 
 * Used to publish events to Kafka topics.
 */
export class KafkaProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 1,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      log.info('Kafka producer connected', { brokers: kafkaConfig.brokers });
    } catch (error) {
      log.error('Failed to connect Kafka producer', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      log.info('Kafka producer disconnected');
    } catch (error) {
      log.error('Error disconnecting Kafka producer', { error });
    }
  }

  async send(
    topic: string,
    event: any,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }

    try {
      const value = JSON.stringify(event);
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value,
            headers: {
              'content-type': 'application/json',
              'timestamp': new Date().toISOString(),
              ...headers,
            },
          },
        ],
      });
      log.debug('Message sent to Kafka', { topic, key, eventType: event.type || 'unknown' });
    } catch (error) {
      log.error('Failed to send message to Kafka', { topic, error, event });
      throw error;
    }
  }
}

/**
 * Kafka Consumer Class
 * 
 * Used to consume events from Kafka topics.
 * 
 * Key concepts:
 * - Consumer Group: Multiple consumers share the work
 * - Offset: Tracks position in partition
 * - Partition: Topics are divided into partitions for parallelism
 */
class KafkaConsumer {
  private consumer: Consumer;
  private isConnected: boolean = false;
  private messageHandlers: Map<string, (event: any) => Promise<void>> = new Map();
  private groupId: string;
  private fromBeginning: boolean;

  /**
   * @param groupId - Consumer group ID (allows parallel processing)
   * @param fromBeginning - Whether to read from the beginning of the topic
   */
  constructor(groupId: string, fromBeginning: boolean = false) {
    this.groupId = groupId;
    this.fromBeginning = fromBeginning;
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      log.info('Kafka consumer connected', { groupId: this.groupId });
    } catch (error) {
      log.error('Failed to connect Kafka consumer', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      log.info('Kafka consumer disconnected');
    } catch (error) {
      log.error('Error disconnecting Kafka consumer', { error });
    }
  }

  async subscribe(topics: string[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    try {
      const subscribeOptions: any = { topics };
      if (this.fromBeginning) {
        subscribeOptions.fromBeginning = true;
      }
      await this.consumer.subscribe(subscribeOptions);
      log.info('Subscribed to topics', { topics });
    } catch (error) {
      log.error('Failed to subscribe to topics', { topics, error });
      throw error;
    }
  }

  async run(handlers: Record<string, (event: any) => Promise<void>>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    Object.entries(handlers).forEach(([topic, handler]) => {
      this.messageHandlers.set(topic, handler);
    });

    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
      log.info('Consumer started running', { topics: Array.from(this.messageHandlers.keys()) });
    } catch (error) {
      log.error('Error running consumer', { error });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const topicName = topic;

    try {
      const event = JSON.parse(message.value?.toString() || '{}');
      const handler = this.messageHandlers.get(topicName);

      if (!handler) {
        log.warn('No handler found for topic', { topic: topicName });
        return;
      }

      log.debug('Processing message', {
        topic: topicName,
        partition,
        offset: message.offset,
        eventType: event.type || 'unknown',
      });

      await handler(event);

      log.debug('Message processed successfully', {
        topic: topicName,
        partition,
        offset: message.offset,
      });
    } catch (error) {
      log.error('Error processing message', {
        topic: topicName,
        partition,
        offset: message.offset,
        error,
      });
    }
  }
}

export function createKafkaProducer(): KafkaProducer {
  return new KafkaProducer();
}

export function createKafkaConsumer(groupId: string, fromBeginning: boolean = false): KafkaConsumer {
  return new KafkaConsumer(groupId, fromBeginning);
}


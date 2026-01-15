/**
 * Kafka Consumer Utility for Notification Service
 */

import { Kafka, Consumer, KafkaConfig, EachMessagePayload, logLevel } from 'kafkajs';
import { log } from './logger';

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
  },
  connectionTimeout: 3000,
  requestTimeout: 30000,
};

const kafka = new Kafka(kafkaConfig);

class KafkaConsumer {
  private consumer: Consumer;
  private isConnected: boolean = false;
  private messageHandlers: Map<string, (event: any) => Promise<void>> = new Map();
  private groupId: string;
  private fromBeginning: boolean;

  constructor(groupId: string, fromBeginning: boolean = false) {
    this.groupId = groupId;
    this.fromBeginning = fromBeginning;
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
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

export function createKafkaConsumer(groupId: string, fromBeginning: boolean = false): KafkaConsumer {
  return new KafkaConsumer(groupId, fromBeginning);
}


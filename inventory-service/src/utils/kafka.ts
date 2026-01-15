/**
 * Kafka Producer Utility for Inventory Service
 * 
 * This file provides Kafka producer functionality for publishing events.
 * Each service has its own Kafka utilities - no shared dependencies.
 */

import { Kafka, Producer, KafkaConfig, logLevel } from 'kafkajs';
import { log } from './logger';

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'inventory-service-client',
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

export function createKafkaProducer(): KafkaProducer {
  return new KafkaProducer();
}


/**
 * Logger Utility for Order Service
 * 
 * This file provides structured logging capabilities.
 * See user-service/src/utils/logger.ts for detailed explanation.
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        service: service || 'order-service',
        message,
        ...meta,
      });
    })
  ),
  defaultMeta: { service: 'order-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/order-service-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/order-service-combined.log',
    }),
  ],
});

export const log = {
  error: (message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  },
  warn: (message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  },
  info: (message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  },
  debug: (message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  },
};


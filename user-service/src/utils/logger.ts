/**
 * Logger Utility
 * 
 * This file provides structured logging capabilities for the User Service.
 * We use Winston, which is an industry-standard logging library for Node.js.
 * 
 * Why structured logging?
 * - Easy to search and filter logs
 * - Can be aggregated by log analysis tools (ELK, Splunk, etc.)
 * - Better than string concatenation for complex data
 * - Works well with distributed systems
 */

import winston from 'winston';

/**
 * Create a Winston logger instance
 * 
 * Winston is configured with:
 * - Console transport: Logs to terminal (useful for development)
 * - File transports: Logs to files (useful for production)
 * - JSON format: Structured logs that can be parsed
 * - Log levels: error, warn, info, debug
 */
const logger = winston.createLogger({
  // Log level - only logs at this level and above
  // In production, set to 'info' or 'warn'
  // In development, can set to 'debug' for more verbose logs
  level: process.env.LOG_LEVEL || 'info',
  
  // Format logs as JSON for structured logging
  // This makes it easy to parse and search logs
  format: winston.format.combine(
    // Add timestamp to every log entry
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    
    // Include error stack traces when available
    winston.format.errors({ stack: true }),
    
    // Convert to JSON format
    winston.format.json(),
    
    // Custom format that includes service name
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      // Return JSON string with all metadata
      return JSON.stringify({
        timestamp,        // When the log was created
        level,            // Log level (error, warn, info, debug)
        service: service || 'user-service',  // Service name for filtering
        message,          // The log message
        ...meta           // Any additional metadata passed to logger
      });
    })
  ),
  
  // Default metadata included in all logs
  defaultMeta: { 
    service: 'user-service'  // Service identifier
  },
  
  // Transports define where logs are written
  transports: [
    // Console transport - writes to terminal
    // In development, we use colorized output for readability
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),  // Add colors to log levels
        winston.format.simple()      // Simple format for console
      ),
    }),
    
    // File transport for errors only
    // All error-level logs go to this file
    new winston.transports.File({
      filename: 'logs/user-service-error.log',
      level: 'error',  // Only log errors to this file
    }),
    
    // File transport for all logs
    // All logs (all levels) go to this file
    new winston.transports.File({
      filename: 'logs/user-service-combined.log',
    }),
  ],
});

/**
 * Export logger functions
 * 
 * These are the functions you'll use throughout the service to log events.
 * Each function corresponds to a log level:
 * - error: For exceptions, failures, critical issues
 * - warn: For potential issues that don't stop execution
 * - info: For general information about application flow
 * - debug: For detailed debugging information
 */
export const log = {
  /**
   * Log an error
   * Use for exceptions, failures, and critical issues
   * 
   * @param message - Error message
   * @param context - Additional context (error object, request ID, etc.)
   */
  error: (message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  },
  
  /**
   * Log a warning
   * Use for potential issues that don't stop execution
   * 
   * @param message - Warning message
   * @param context - Additional context
   */
  warn: (message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  },
  
  /**
   * Log informational message
   * Use for general information about application flow
   * 
   * @param message - Info message
   * @param context - Additional context
   */
  info: (message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  },
  
  /**
   * Log debug message
   * Use for detailed debugging information
   * 
   * @param message - Debug message
   * @param context - Additional context
   */
  debug: (message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  },
};


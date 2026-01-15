/**
 * Database Configuration
 * 
 * Handles MongoDB connection using Mongoose
 */

import mongoose from 'mongoose';
import { log } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB
 * 
 * Establishes connection to MongoDB database using Mongoose.
 * Handles connection events and errors.
 */
export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://USER:PASSWORD@cluster.mongodb.net/user-management?retryWrites=true&w=majority';

  try {
    // Connection options for production-grade setup
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(mongoUri, options);

    log.info('[DATABASE] ✅ Connected to MongoDB', {
      uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      database: mongoose.connection.db?.databaseName,
    });

    // Connection event handlers
    mongoose.connection.on('error', (error) => {
      log.error('[DATABASE] ❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      log.warn('[DATABASE] ⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      log.info('[DATABASE] ✅ MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      log.info('[DATABASE] MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    log.error('[DATABASE] ❌ Failed to connect to MongoDB:', error as Record<string, any>);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    log.info('[DATABASE] ✅ Disconnected from MongoDB');
  } catch (error) {
    log.error('[DATABASE] ❌ Error disconnecting from MongoDB:', error as Record<string, any>);
    throw error;
  }
}


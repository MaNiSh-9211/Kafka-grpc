/**
 * Database Configuration for Payment Service
 */

import mongoose from 'mongoose';
import { log } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://USER:PASSWORD@cluster.mongodb.net/payment-management?retryWrites=true&w=majority';

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(mongoUri, options);

    log.info('[DATABASE] ✅ Connected to MongoDB', {
      database: mongoose.connection.db?.databaseName,
    });

    mongoose.connection.on('error', (error) => {
      log.error('[DATABASE] ❌ MongoDB connection error:', error);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    log.error('[DATABASE] ❌ Failed to connect to MongoDB:', error as Record<string, any>);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
  } catch (error) {
    log.error('[DATABASE] ❌ Error disconnecting:', error as Record<string, any>);
  }
}


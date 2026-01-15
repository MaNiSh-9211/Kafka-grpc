/**
 * gRPC Server Setup for Inventory Service
 * 
 * This file sets up the gRPC server that exposes inventory management endpoints.
 * Other services (like Order Service) call these endpoints synchronously.
 */

import * as grpc from '@grpc/grpc-js';
import { log } from './utils/logger';
import { loadProto, createServer } from './utils/grpc';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './models/Product';
import { Reservation } from './models/Reservation';
import { KafkaProducer } from './utils/kafka';

export async function setupGrpcServer(
  kafkaProducer: KafkaProducer
): Promise<void> {
  try {
    // Load proto definition
    const InventoryService = loadProto(
      join(__dirname, '../proto/inventory.proto'),
      'inventory'
    );

    // Create gRPC server
    const grpcServer = createServer();

    // Implement InventoryService methods
    grpcServer.addService(InventoryService.InventoryService.service, {
      /**
       * CheckStock - Check if product is in stock
       */
      checkStock: async (call: any, callback: any) => {
        try {
          const { productId, quantity } = call.request;

          const product = await Product.findOne({ id: productId });
          if (!product) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Product not found',
            });
          }

          const inStock = product.availableQuantity >= quantity;

          callback(null, {
            productId,
            inStock,
            availableQuantity: product.availableQuantity,
            reservedQuantity: product.reservedQuantity,
          });

          log.debug('Stock checked via gRPC', {
            productId,
            quantity,
            inStock,
            availableQuantity: product.availableQuantity,
          });
        } catch (error) {
          log.error('Error checking stock', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * ReserveInventory - Reserve inventory for an order
       */
      reserveInventory: async (call: any, callback: any) => {
        try {
          const { orderId, productId, quantity } = call.request;

          const product = await Product.findOne({ id: productId });
          if (!product) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Product not found',
            });
          }

          if (product.availableQuantity < quantity) {
            return callback({
              code: grpc.status.FAILED_PRECONDITION,
              message: 'Insufficient stock',
            });
          }

          const reservationId = uuidv4();
          const reservation = new Reservation({
            id: reservationId,
            orderId,
            productId,
            quantity,
          });
          await reservation.save();

          // Update product inventory
          product.availableQuantity -= quantity;
          product.reservedQuantity += quantity;
          await product.save();

          await kafkaProducer.send('inventory.updated', {
            type: 'inventory.updated',
            productId,
            quantity: product.totalQuantity - product.reservedQuantity,
            availableQuantity: product.availableQuantity,
            reservedQuantity: product.reservedQuantity,
            timestamp: product.updatedAt,
          }, productId);

          if (product.availableQuantity < 10) {
            await kafkaProducer.send('inventory.low', {
              type: 'inventory.low',
              productId,
              availableQuantity: product.availableQuantity,
              timestamp: new Date().toISOString(),
            }, productId);
          }

          callback(null, {
            reservationId,
            success: true,
            message: 'Inventory reserved successfully',
          });

          log.info('Inventory reserved via gRPC', {
            reservationId,
            orderId,
            productId,
            quantity,
          });
        } catch (error) {
          log.error('Error reserving inventory', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * ReleaseInventory - Release reserved inventory
       */
      releaseInventory: async (call: any, callback: any) => {
        try {
          const { reservationId, orderId } = call.request;

          const reservation = await Reservation.findOne({ id: reservationId });
          if (!reservation) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Reservation not found',
            });
          }

          if (reservation.orderId !== orderId) {
            return callback({
              code: grpc.status.FAILED_PRECONDITION,
              message: 'Order ID mismatch',
            });
          }

          const product = await Product.findOne({ id: reservation.productId });
          if (product) {
            product.availableQuantity += reservation.quantity;
            product.reservedQuantity -= reservation.quantity;
            await product.save();

            await kafkaProducer.send('inventory.updated', {
              type: 'inventory.updated',
              productId: reservation.productId,
              quantity: product.totalQuantity - product.reservedQuantity,
              availableQuantity: product.availableQuantity,
              reservedQuantity: product.reservedQuantity,
              timestamp: product.updatedAt.toISOString(),
            }, reservation.productId);
          }

          reservation.status = 'RELEASED';
          await reservation.save();

          callback(null, {
            success: true,
            message: 'Inventory released successfully',
          });

          log.info('Inventory released via gRPC', {
            reservationId,
            orderId,
            productId: reservation.productId,
          });
        } catch (error) {
          log.error('Error releasing inventory', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * UpdateInventory - Update inventory quantity
       */
      updateInventory: async (call: any, callback: any) => {
        try {
          const { productId, quantity, updateType } = call.request;

          const product = await Product.findOne({ id: productId });
          if (!product) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Product not found',
            });
          }

          let newQuantity = product.totalQuantity;
          if (updateType === 0) {
            newQuantity = quantity;
          } else if (updateType === 1) {
            newQuantity = product.totalQuantity + quantity;
          } else if (updateType === 2) {
            newQuantity = Math.max(0, product.totalQuantity - quantity);
          }

          const availableDelta = newQuantity - product.totalQuantity;
          product.totalQuantity = newQuantity;
          product.availableQuantity = Math.max(0, product.availableQuantity + availableDelta);
          await product.save();

          await kafkaProducer.send('inventory.updated', {
            type: 'inventory.updated',
            productId,
            quantity: product.totalQuantity - product.reservedQuantity,
            availableQuantity: product.availableQuantity,
            reservedQuantity: product.reservedQuantity,
            timestamp: product.updatedAt,
          }, productId);

          callback(null, {
            productId,
            newQuantity: product.totalQuantity,
            success: true,
          });

          log.info('Inventory updated via gRPC', {
            productId,
            newQuantity: product.totalQuantity,
          });
        } catch (error) {
          log.error('Error updating inventory', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },

      /**
       * GetInventory - Get product inventory details
       */
      getInventory: async (call: any, callback: any) => {
        try {
          const { productId } = call.request;

          const product = await Product.findOne({ id: productId });
          if (!product) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Product not found',
            });
          }

          callback(null, {
            productId: product.id,
            productName: product.name,
            totalQuantity: product.totalQuantity,
            availableQuantity: product.availableQuantity,
            reservedQuantity: product.reservedQuantity,
          });
        } catch (error) {
          log.error('Error getting inventory', { error });
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error',
          });
        }
      },
    });

    const grpcPort = process.env.GRPC_PORT || 50041;
    grpcServer.bindAsync(
      `0.0.0.0:${grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          log.error('Failed to start gRPC server', { error });
          throw error;
        }
        grpcServer.start();
        log.info(`Inventory Service gRPC server running on port ${port}`);
      }
    );
  } catch (error) {
    log.error('Failed to setup gRPC server', { error });
    throw error;
  }
}


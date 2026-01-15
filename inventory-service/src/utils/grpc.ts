/**
 * gRPC Server Utility for Inventory Service
 * 
 * This file provides utilities for creating a gRPC server.
 * Inventory Service acts as a gRPC SERVER, exposing inventory management endpoints.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { log } from './logger';
import { join } from 'path';

function loadProto(protoPath: string, packageName: string): any {
  try {
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    return proto[packageName];
  } catch (error) {
    log.error('Failed to load proto file', { protoPath, error });
    throw error;
  }
}

function createServer(options?: grpc.ServerOptions): grpc.Server {
  const defaultOptions: grpc.ServerOptions = {
    'grpc.keepalive_time_ms': 30000,
    'grpc.keepalive_timeout_ms': 5000,
    'grpc.http2.max_pings_without_data': 0,
    'grpc.http2.min_time_between_pings_ms': 10000,
    'grpc.http2.min_ping_interval_without_data_ms': 300000,
    ...options,
  };

  const server = new grpc.Server(defaultOptions);
  log.info('gRPC server created');
  return server;
}

export { loadProto, createServer };


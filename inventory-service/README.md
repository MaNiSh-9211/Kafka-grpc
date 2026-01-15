# Inventory Service

Standalone microservice for managing product inventory and stock levels. Exposes gRPC server for synchronous inventory operations.

## Overview

The Inventory Service is responsible for:
- Tracking product inventory levels
- Reserving inventory for orders
- Releasing inventory when orders are cancelled
- Monitoring low stock and out-of-stock situations

## Architecture

- **HTTP Server**: REST API on port 5004
- **gRPC Server**: Inventory management endpoints on port 5004
- **Kafka Producer**: Publishes inventory events
- **Kafka Consumer**: Consumes order events
- **Storage**: In-memory (use database in production)

## API Endpoints

### HTTP (REST)
- `GET /health` - Health check
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `GET /reservations` - Get all reservations

### gRPC
- `CheckStock` - Check if product is in stock
- `ReserveInventory` - Reserve inventory for an order
- `ReleaseInventory` - Release reserved inventory
- `UpdateInventory` - Update inventory quantity
- `GetInventory` - Get product inventory details

## Communication

### gRPC Server (Synchronous)
- Exposes inventory management endpoints
- Called by Order Service when creating orders
- Provides immediate response for stock checks and reservations

### Kafka Events (Asynchronous)

**Published:**
- `inventory.updated` - When inventory is updated
- `inventory.low` - When stock is low (< 10 units)
- `inventory.out-of-stock` - When product is out of stock

**Consumed:**
- `order.created` - When an order is created
- `order.cancelled` - When an order is cancelled (releases inventory)

## Environment Variables

- `PORT` - HTTP server port (default: 5004)
- `GRPC_PORT` - gRPC server port (default: 5004)
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `KAFKA_CLIENT_ID` - Kafka client ID (default: inventory-service-client)
- `LOG_LEVEL` - Logging level (default: info)

## Running Locally

```bash
npm install
npm run build
npm start
```

## Running with Docker

```bash
docker build -t inventory-service .
docker run -p 5004:5004 -e KAFKA_BROKERS=kafka:9092 inventory-service
```


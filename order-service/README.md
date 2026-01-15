# Order Service

Standalone microservice for handling order creation and management. Demonstrates orchestration pattern with gRPC and Kafka.

## Overview

The Order Service is responsible for:
- Creating and managing orders
- Orchestrating Payment Service (gRPC) for payment processing
- Orchestrating Inventory Service (gRPC) for stock checks
- Publishing order events to Kafka
- Consuming events from other services

## Architecture

- **HTTP Server**: REST API on port 5002
- **Kafka Producer**: Publishes order events
- **Kafka Consumer**: Consumes events from other services
- **gRPC Clients**: Calls Payment and Inventory services
- **Storage**: In-memory (use database in production)

## API Endpoints

- `GET /health` - Health check
- `POST /orders` - Create a new order (orchestrates payment and inventory)
- `GET /orders/:id` - Get order by ID
- `GET /orders` - Get all orders
- `PUT /orders/:id/status` - Update order status

## Communication

### Kafka Events Published
- `order.created` - When an order is created
- `order.status.updated` - When order status changes

### Kafka Events Consumed
- `user.created` - When a new user is created
- `inventory.updated` - When inventory is updated
- `payment.processed` - When payment is processed

### gRPC Calls
- **Payment Service**: `ProcessPayment` - Process payment for an order
- **Inventory Service**: `CheckStock` - Check if products are in stock
- **Inventory Service**: `ReserveInventory` - Reserve inventory for an order

## Order Creation Flow

1. Validate order data
2. Check inventory (gRPC → Inventory Service)
3. Reserve inventory (gRPC → Inventory Service)
4. Process payment (gRPC → Payment Service)
5. Create order
6. Publish `order.created` event (Kafka)

## Environment Variables

- `PORT` - HTTP server port (default: 5002)
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `PAYMENT_SERVICE_URL` - Payment Service gRPC address (default: localhost:5003)
- `INVENTORY_SERVICE_URL` - Inventory Service gRPC address (default: localhost:5004)
- `LOG_LEVEL` - Logging level (default: info)

## Running Locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Or development mode
npm run dev
```

## Running with Docker

```bash
# Build image
docker build -t order-service .

# Run container
docker run -p 5002:5002 \
  -e KAFKA_BROKERS=kafka:9092 \
  -e PAYMENT_SERVICE_URL=payment-service:5003 \
  -e INVENTORY_SERVICE_URL=inventory-service:5004 \
  order-service
```

## Testing

```bash
# Create an order
curl -X POST http://localhost:5002/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "items": [
      {"productId": "prod-1", "quantity": 2, "price": 29.99}
    ]
  }'
```

## Code Structure

```
order-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes.ts         # HTTP routes
│   ├── kafka.ts          # Kafka consumer setup
│   └── utils/
│       ├── logger.ts     # Logging utility
│       ├── kafka.ts      # Kafka producer/consumer
│       └── grpc.ts       # gRPC client utilities
├── proto/
│   ├── payment.proto     # Payment Service proto definition
│   └── inventory.proto   # Inventory Service proto definition
├── Dockerfile
├── package.json
└── tsconfig.json
```


# Payment Service

Standalone microservice for processing payments and managing payment transactions. Exposes gRPC server for synchronous payment processing.

## Overview

The Payment Service is responsible for:
- Processing payments (credit card, debit card, etc.)
- Handling payment refunds
- Managing payment status
- Exposing gRPC server for synchronous payment processing

## Architecture

- **HTTP Server**: REST API on port 5003
- **gRPC Server**: Payment processing endpoints on port 5003
- **Kafka Producer**: Publishes payment events
- **Kafka Consumer**: Consumes order events (optional)
- **Storage**: In-memory (use database in production)

## API Endpoints

### HTTP (REST)
- `GET /health` - Health check
- `GET /payments/:id` - Get payment by ID
- `GET /payments` - Get all payments

### gRPC
- `ProcessPayment` - Process a payment (called by Order Service)
- `RefundPayment` - Refund a payment
- `GetPaymentStatus` - Get payment status

## Communication

### gRPC Server (Synchronous)
- Exposes payment processing endpoints
- Called by Order Service when creating orders
- Provides immediate response for payment status

### Kafka Events (Asynchronous)

**Published:**
- `payment.processed` - When payment is processed
- `payment.failed` - When payment fails
- `payment.refunded` - When payment is refunded

**Consumed:**
- `order.created` - When an order is created (for async processing)

## Environment Variables

- `PORT` - HTTP server port (default: 5003)
- `GRPC_PORT` - gRPC server port (default: 5003)
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `KAFKA_CLIENT_ID` - Kafka client ID (default: payment-service-client)
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
docker build -t payment-service .

# Run container
docker run -p 5003:5003 \
  -e KAFKA_BROKERS=kafka:9092 \
  payment-service
```

## Testing

### gRPC (via Order Service)
The Order Service automatically calls Payment Service via gRPC when creating orders.

### HTTP
```bash
# Get all payments
curl http://localhost:5003/payments

# Get payment by ID
curl http://localhost:5003/payments/{paymentId}
```

## Code Structure

```
payment-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes.ts         # HTTP routes
│   ├── grpc.ts           # gRPC server setup
│   ├── kafka.ts          # Kafka consumer setup
│   └── utils/
│       ├── logger.ts     # Logging utility
│       ├── kafka.ts      # Kafka producer
│       ├── kafka-consumer.ts # Kafka consumer
│       └── grpc.ts       # gRPC utilities
├── proto/
│   └── payment.proto     # Payment Service proto definition
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Production Considerations

1. **Database**: Replace in-memory store with PostgreSQL/MongoDB
2. **Payment Gateway**: Integrate with Stripe, PayPal, etc.
3. **Security**: Add TLS/SSL for gRPC, encrypt sensitive data
4. **Monitoring**: Add Prometheus metrics
5. **Error Handling**: Add retry logic, circuit breakers
6. **Testing**: Add unit and integration tests


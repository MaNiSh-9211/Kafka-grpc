# Notification Service

Standalone microservice for sending notifications (email, SMS, push) to users based on events from all other services.

## Overview

The Notification Service is responsible for:
- Sending email notifications
- Sending SMS notifications
- Sending push notifications
- Tracking notification delivery status

## Architecture

- **HTTP Server**: REST API on port 5005
- **Kafka Consumer**: Consumes events from ALL services
- **Kafka Producer**: Publishes notification events
- **Storage**: In-memory (use database in production)

## API Endpoints

- `GET /health` - Health check
- `GET /notifications` - Get all notifications
- `GET /notifications/user/:userId` - Get notifications for a user
- `GET /notifications/:id` - Get notification by ID

## Communication

### Kafka Events (Asynchronous)

**Consumed:**
- `user.created` - Send welcome email
- `order.created` - Send order confirmation
- `order.status.updated` - Send status update
- `order.completed` - Send completion notification
- `payment.processed` - Send payment confirmation/failure
- `inventory.low` - Send low stock alert

**Published:**
- `notification.sent` - When notification is sent successfully
- `notification.failed` - When notification fails to send

## Event-Driven Architecture

This service demonstrates the power of event-driven architecture:
- **Decoupled**: Doesn't need to know about other services directly
- **Scalable**: Can handle events from any number of services
- **Extensible**: Easy to add new notification types without modifying other services
- **Resilient**: If this service is down, other services continue to work

## Environment Variables

- `PORT` - HTTP server port (default: 5005)
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `KAFKA_CLIENT_ID` - Kafka client ID (default: notification-service-client)
- `LOG_LEVEL` - Logging level (default: info)

## Running Locally

```bash
npm install
npm run build
npm start
```

## Running with Docker

```bash
docker build -t notification-service .
docker run -p 5005:5005 -e KAFKA_BROKERS=kafka:9092 notification-service
```

## Testing

Notifications are automatically sent when events occur. Check the notifications endpoint:

```bash
curl http://localhost:5005/notifications
```

## Code Structure

```
notification-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes.ts         # HTTP routes
│   ├── kafka.ts          # Kafka consumer setup
│   └── utils/
│       ├── logger.ts     # Logging utility
│       ├── kafka.ts      # Kafka producer
│       └── kafka-consumer.ts # Kafka consumer
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Production Considerations

1. **Notification Providers**: Integrate with SendGrid, Twilio, FCM, etc.
2. **Database**: Replace in-memory store with PostgreSQL/MongoDB
3. **Retry Logic**: Add retry mechanism for failed notifications
4. **Rate Limiting**: Prevent notification spam
5. **Templates**: Use template engine for notification messages
6. **Monitoring**: Add Prometheus metrics
7. **Testing**: Add unit and integration tests


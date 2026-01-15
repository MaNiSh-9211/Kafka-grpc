# User Service

Standalone microservice for managing user accounts and authentication.

## Overview

The User Service is responsible for:
- Creating and managing user accounts
- User authentication (not implemented in this demo)
- Publishing user events to Kafka

## Architecture

- **HTTP Server**: REST API on port 5001
- **Kafka Producer**: Publishes user events
- **Storage**: In-memory (use database in production)

## API Endpoints

- `GET /health` - Health check
- `POST /users` - Create a new user
- `GET /users/:id` - Get user by ID
- `GET /users` - Get all users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Kafka Events Published

- `user.created` - When a new user is created
- `user.updated` - When a user is updated
- `user.deleted` - When a user is deleted

## Environment Variables

- `PORT` - HTTP server port (default: 5001)
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `KAFKA_CLIENT_ID` - Kafka client ID (default: user-service-client)
- `LOG_LEVEL` - Logging level (default: info)

## Running Locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Or development mode with hot reload
npm run dev
```

## Running with Docker

```bash
# Build image
docker build -t user-service .

# Run container
docker run -p 5001:5001 \
  -e KAFKA_BROKERS=kafka:9092 \
  user-service
```

## Testing

```bash
# Create a user
curl -X POST http://localhost:5001/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Get user
curl http://localhost:5001/users/{userId}
```

## Code Structure

```
user-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes.ts         # HTTP routes
│   └── utils/
│       ├── logger.ts     # Logging utility
│       └── kafka.ts      # Kafka producer
├── Dockerfile            # Docker image definition
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Production Considerations

1. **Database**: Replace in-memory store with PostgreSQL/MongoDB
2. **Authentication**: Add JWT or OAuth2
3. **Validation**: Add input validation library (Joi, Zod)
4. **Error Handling**: Add error handling middleware
5. **Monitoring**: Add Prometheus metrics
6. **Security**: Add rate limiting, CORS configuration
7. **Testing**: Add unit and integration tests


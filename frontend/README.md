# Kafka Microservices Frontend

A comprehensive React + TypeScript frontend dashboard for testing and monitoring all microservices.

## Features

- 📊 **Service Pages** - Dedicated page for each microservice
- 🔍 **API Testing** - Test all REST APIs directly from the UI
- 📨 **Kafka Events Dashboard** - View all Kafka topics, producers, and consumers
- 🎯 **gRPC Information** - Clear indication of which services use gRPC
- 🏷️ **Producer/Consumer Badges** - Visual indicators for service roles
- 📝 **Detailed Documentation** - Complete API documentation with flow descriptions

## Installation

```bash
cd frontend
npm install
```

## Running

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Pages

### 1. User Service Page
- View all user APIs
- Create, read, update, delete users
- See which APIs publish Kafka events
- **Producer**: Publishes `user.created`, `user.updated`, `user.deleted`

### 2. Order Service Page
- View all order APIs
- Create orders (triggers gRPC calls to Payment & Inventory)
- See gRPC client calls
- **Producer**: Publishes `order.created`, `order.status.updated`
- **Consumer**: Consumes `user.created`, `inventory.updated`, `payment.processed`
- **gRPC Client**: Calls Payment Service and Inventory Service

### 3. Payment Service Page
- View payment APIs
- See gRPC server endpoints
- **Producer**: Publishes `payment.processed`, `payment.failed`, `payment.refunded`
- **Consumer**: Consumes `order.created` (optional)
- **gRPC Server**: Exposes ProcessPayment, RefundPayment, GetPaymentStatus

### 4. Inventory Service Page
- View inventory APIs
- See gRPC server endpoints
- **Producer**: Publishes `inventory.updated`, `inventory.low`
- **Consumer**: Consumes `order.created`
- **gRPC Server**: Exposes CheckStock, ReserveInventory, ReleaseInventory

### 5. Notification Service Page
- View notification APIs
- See all consumed events
- **Consumer Only**: Consumes all events from all services
- Sends notifications based on events

### 6. Kafka Events Dashboard
- View all Kafka topics
- See producers and consumers for each topic
- Service communication summary
- Complete event flow documentation

## API Endpoints

The frontend proxies requests to:
- User Service: `http://localhost:5001`
- Order Service: `http://localhost:5002`
- Payment Service: `http://localhost:5003`
- Inventory Service: `http://localhost:5004`
- Notification Service: `http://localhost:5005`

## Features Explained

### Producer Badge (Green)
Services that publish events to Kafka topics.

### Consumer Badge (Blue)
Services that consume events from Kafka topics.

### gRPC Badge (Orange)
Services that use gRPC (either as client or server).

### API Details
Each API shows:
- **Producer**: Whether it publishes Kafka events
- **Consumer**: Whether it consumes events
- **gRPC**: Whether it uses gRPC (client or server)
- **Flow**: Complete request flow for complex operations

## Testing Workflow

1. **Start all services**: Run `start-all-services.bat`
2. **Start frontend**: Run `npm run dev` in frontend directory
3. **Test User Service**: Create a user → See `user.created` event
4. **Test Order Service**: Create an order → See gRPC calls and events
5. **View Kafka Events**: Check the Kafka Events page to see all topics
6. **Check Notifications**: View notifications created from events

## Architecture Visualization

The frontend helps visualize:
- Which services are producers/consumers
- Which APIs trigger Kafka events
- Which services use gRPC
- Complete event flow between services


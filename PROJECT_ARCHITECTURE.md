# Project Architecture - Complete Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [Service Architecture](#service-architecture)
5. [Communication Patterns](#communication-patterns)
6. [Data Flow](#data-flow)
7. [Infrastructure](#infrastructure)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability Considerations](#scalability-considerations)
10. [Security Architecture](#security-architecture)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│                   (React + Vite, Port 3000)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Microservices Layer                          │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│   User   │  Order   │ Payment  │Inventory │  Notification    │
│ Service  │ Service  │ Service  │ Service  │    Service       │
│  :5001   │  :5002   │  :5003   │  :5004   │     :5005        │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────────┬────────┘
     │          │          │           │              │
     │ gRPC     │ gRPC     │ gRPC      │ gRPC         │
     │          │          │           │              │
     └──────────┴──────────┴───────────┘              │
              │                                         │
              │ Kafka Events                            │
              │                                         │
     ┌────────▼─────────────────────────────────────────▼────┐
     │         Event Streaming Layer (Kafka)                  │
     │         + Coordination (Zookeeper)                     │
     └────────────────────────────────────────────────────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │      Data Layer (MongoDB)           │
     │  (Each service has its own database) │
     └─────────────────────────────────────┘
```

### Core Principles

1. **Microservices Architecture**: Each service is independent
2. **Event-Driven Communication**: Services communicate via Kafka events
3. **Synchronous RPC**: Critical operations use gRPC
4. **Database per Service**: Each service has its own database
5. **API Gateway Pattern**: Frontend calls services directly (can add gateway)
6. **CQRS**: Commands (writes) and Queries (reads) separated

---

## Architecture Patterns

### 1. Microservices Pattern

**Each service:**
- Has its own codebase
- Has its own database
- Can be deployed independently
- Communicates via well-defined APIs

**Benefits:**
- **Scalability**: Scale services independently
- **Technology Diversity**: Use different tech stacks
- **Fault Isolation**: Failure in one service doesn't break others
- **Team Autonomy**: Teams can work independently

### 2. Event-Driven Architecture

**Pattern:**
- Services publish events when state changes
- Other services consume events and react
- Services are decoupled

**Example:**
```
User Service publishes user.created
  ↓
Notification Service consumes → Sends welcome email
Order Service consumes → Initializes user order history
```

**Benefits:**
- **Decoupling**: Services don't need to know about each other
- **Scalability**: Easy to add new consumers
- **Resilience**: If consumer is down, events are queued
- **Event Sourcing**: Events are the source of truth

### 3. API Gateway Pattern (Future)

**Current**: Frontend calls services directly
**Future**: Add API Gateway for:
- Authentication/Authorization
- Rate limiting
- Request routing
- Load balancing
- API versioning

### 4. Database per Service

**Each service has its own database:**
- User Service → `user-management` database
- Order Service → In-memory (demo) or `order-management`
- Payment Service → In-memory (demo) or `payment-management`
- Inventory Service → `inventory-management` database
- Notification Service → `notification-management` database

**Benefits:**
- **Data Isolation**: Services don't share databases
- **Technology Choice**: Can use different databases
- **Scalability**: Scale databases independently
- **Fault Isolation**: Database failure affects one service

### 5. CQRS (Command Query Responsibility Segregation)

**Commands (Writes):**
- Create order → Order Service
- Process payment → Payment Service
- Reserve inventory → Inventory Service

**Queries (Reads):**
- Get products → Inventory Service
- Get orders → Order Service
- Get payments → Payment Service

**Benefits:**
- **Optimization**: Optimize reads and writes separately
- **Scalability**: Scale read and write independently
- **Flexibility**: Different data models for reads/writes

### 6. Saga Pattern

**Distributed transactions via events:**

**Order Creation Saga:**
```
1. Reserve Inventory (gRPC)
2. Process Payment (gRPC)
3. Create Order
4. If any step fails → Rollback
```

**Order Cancellation Saga:**
```
1. Cancel Order
2. Release Inventory (gRPC)
3. Refund Payment (gRPC)
```

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Routing**: React Router
- **State Management**: React Hooks + localStorage

### Backend Services
- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **gRPC**: @grpc/grpc-js
- **Kafka**: kafkajs
- **Logging**: Custom logger (Pino-based)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Event Streaming**: Apache Kafka 7.5.0
- **Coordination**: Apache Zookeeper
- **Database**: MongoDB (each service)

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Build**: TypeScript Compiler
- **Scripts**: Batch files (Windows)

---

## Service Architecture

### User Service

**Responsibilities:**
- User CRUD operations
- User authentication (future)
- User profile management

**Technology:**
- Express.js HTTP server
- MongoDB for persistence
- Kafka producer for events

**Endpoints:**
- `POST /users` - Create user
- `GET /users` - List users
- `GET /users/:id` - Get user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

**Events Published:**
- `user.created`
- `user.updated`
- `user.deleted`

### Order Service

**Responsibilities:**
- Order management
- Orchestrates payment and inventory
- Order status tracking

**Technology:**
- Express.js HTTP server
- In-memory storage (demo) or MongoDB
- gRPC client (Payment, Inventory)
- Kafka producer and consumer

**Endpoints:**
- `POST /orders` - Create order
- `GET /orders` - List orders
- `GET /orders/:id` - Get order
- `PUT /orders/:id/status` - Update status
- `DELETE /orders/:id` - Cancel order

**gRPC Calls:**
- `PaymentService.ProcessPayment`
- `InventoryService.CheckStock`
- `InventoryService.ReserveInventory`
- `InventoryService.ReleaseInventory`

**Events Published:**
- `order.created`
- `order.status.updated`
- `order.cancelled`

**Events Consumed:**
- `user.created`
- `inventory.updated`
- `payment.processed`

### Payment Service

**Responsibilities:**
- Payment processing
- Payment status tracking
- Refund processing

**Technology:**
- Express.js HTTP server
- gRPC server
- In-memory storage (demo) or MongoDB
- Kafka producer and consumer

**Endpoints:**
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment

**gRPC Methods:**
- `ProcessPayment`
- `RefundPayment`
- `GetPaymentStatus`

**Events Published:**
- `payment.processed`
- `payment.failed`
- `payment.refunded`

**Events Consumed:**
- `order.created`

### Inventory Service

**Responsibilities:**
- Product management
- Inventory tracking
- Stock reservations

**Technology:**
- Express.js HTTP server
- gRPC server
- MongoDB for persistence
- Kafka producer and consumer

**Endpoints:**
- `GET /products` - List products
- `GET /products/:id` - Get product
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `GET /reservations` - List reservations

**gRPC Methods:**
- `CheckStock`
- `ReserveInventory`
- `ReleaseInventory`
- `UpdateInventory`
- `GetInventory`

**Events Published:**
- `inventory.updated`
- `inventory.low`

**Events Consumed:**
- `order.created`
- `order.cancelled`

### Notification Service

**Responsibilities:**
- Send notifications
- Notification history
- Multi-channel notifications (email, SMS, push)

**Technology:**
- Express.js HTTP server
- MongoDB for persistence
- Kafka consumer (consumes all events)

**Endpoints:**
- `GET /notifications` - List notifications
- `GET /notifications/:id` - Get notification
- `GET /notifications/user/:userId` - Get user notifications

**Events Consumed:**
- `user.created`
- `order.created`
- `order.status.updated`
- `order.completed`
- `payment.processed`
- `payment.failed`
- `payment.refunded`
- `inventory.updated`
- `inventory.low`

---

## Communication Patterns

### 1. Synchronous Communication (gRPC)

**When to Use:**
- Need immediate response
- Critical operations
- Transaction coordination

**Examples:**
- Order Service → Payment Service (ProcessPayment)
- Order Service → Inventory Service (CheckStock, ReserveInventory)

**Benefits:**
- **Low Latency**: Direct call, immediate response
- **Type Safety**: Protocol Buffers provide strong typing
- **High Performance**: Binary protocol, HTTP/2

**Drawbacks:**
- **Tight Coupling**: Services must be available
- **No Retry**: Must handle failures explicitly

### 2. Asynchronous Communication (Kafka)

**When to Use:**
- Don't need immediate response
- Event notifications
- Decoupled operations

**Examples:**
- User Service → Notification Service (user.created)
- Order Service → Notification Service (order.created)
- Payment Service → Order Service (payment.processed)

**Benefits:**
- **Decoupling**: Services don't need to know about each other
- **Scalability**: Easy to add consumers
- **Resilience**: Events queued if consumer is down
- **Event Sourcing**: Events are source of truth

**Drawbacks:**
- **Eventual Consistency**: Not immediately consistent
- **Complexity**: Need to handle out-of-order events

### 3. Request-Response (REST)

**When to Use:**
- Frontend to backend
- Public APIs
- Simple CRUD operations

**Examples:**
- Frontend → Inventory Service (GET /products)
- Frontend → Order Service (POST /orders)

**Benefits:**
- **Simple**: Easy to understand and use
- **Browser Support**: Native browser support
- **Human Readable**: JSON is easy to debug

**Drawbacks:**
- **Slower**: Text-based, HTTP/1.1
- **No Streaming**: Limited streaming support

---

## Data Flow

### Order Creation Flow

```
Frontend
  │
  ├─→ Order Service (HTTP POST /orders)
  │     │
  │     ├─→ Inventory Service (gRPC CheckStock)
  │     │     └─→ MongoDB (Query products)
  │     │
  │     ├─→ Inventory Service (gRPC ReserveInventory)
  │     │     ├─→ MongoDB (Create reservation)
  │     │     ├─→ MongoDB (Update product quantities)
  │     │     └─→ Kafka (Publish inventory.updated)
  │     │
  │     ├─→ Payment Service (gRPC ProcessPayment)
  │     │     ├─→ In-Memory (Create payment)
  │     │     └─→ Kafka (Publish payment.processed)
  │     │
  │     ├─→ In-Memory (Create order)
  │     │
  │     └─→ Kafka (Publish order.created)
  │
  └─← Order Service (HTTP 201, Order data)
```

### Event Processing Flow

```
Kafka Topic: order.created
  │
  ├─→ Inventory Service (Consumer)
  │     └─→ Logs event
  │
  ├─→ Payment Service (Consumer)
  │     └─→ Logs event
  │
  └─→ Notification Service (Consumer)
        ├─→ MongoDB (Create notification)
        └─→ Send email
```

---

## Infrastructure

### Docker Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│      (shared-network)                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Zookeeper    │  │ Kafka Broker │   │
│  │ :2181        │  │ :9092, :29092│   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ User Service │  │ Order Service│   │
│  │ :5001        │  │ :5002        │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Payment Svc  │  │ Inventory Svc│   │
│  │ :5003, :50031│  │ :5004, :50041│   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐                      │
│  │ Notification │                      │
│  │ Service :5005│                      │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

### Network Configuration

**External Ports (Host → Container):**
- 3000 → Frontend
- 5001 → User Service
- 5002 → Order Service
- 5003 → Payment Service (HTTP)
- 5004 → Inventory Service (HTTP)
- 5005 → Notification Service
- 9092 → Kafka (external)
- 2181 → Zookeeper

**Internal Ports (Container → Container):**
- 50031 → Payment Service (gRPC)
- 50041 → Inventory Service (gRPC)
- 29092 → Kafka (internal)

### Volume Management

**Persistent Volumes:**
- `zookeeper-data`: Zookeeper data
- `zookeeper-logs`: Zookeeper logs
- `kafka-data`: Kafka data
- Service logs: Mounted to `./logs` directories

---

## Deployment Architecture

### Development Setup

**Single Machine:**
- All services in Docker containers
- Single Kafka broker
- Single Zookeeper node
- MongoDB in containers (or external)

**Startup Order:**
1. Zookeeper
2. Kafka
3. User Service
4. Order Service
5. Payment Service
6. Inventory Service
7. Notification Service
8. Frontend

### Production Setup (Recommended)

**Multi-Machine:**
- Services distributed across machines
- Kafka cluster (3+ brokers)
- Zookeeper ensemble (3+ nodes)
- MongoDB replica sets
- Load balancers
- API Gateway

**High Availability:**
- Multiple instances of each service
- Kafka replication factor: 3
- Zookeeper quorum: 3/5
- MongoDB replica sets

---

## Scalability Considerations

### Horizontal Scaling

**Services:**
- Run multiple instances of each service
- Use load balancer to distribute traffic
- Stateless services (use external database)

**Kafka:**
- Add more brokers
- Increase partition count
- Add more consumers

**Database:**
- MongoDB sharding
- Read replicas
- Connection pooling

### Vertical Scaling

**Increase Resources:**
- More CPU
- More memory
- Faster disks (SSD)

### Performance Optimization

**Caching:**
- Redis for frequently accessed data
- CDN for static assets
- Application-level caching

**Database Optimization:**
- Indexes on frequently queried fields
- Connection pooling
- Query optimization

**Kafka Optimization:**
- Compression (gzip, snappy)
- Batch size tuning
- Producer/consumer tuning

---

## Security Architecture

### Current State (Development)

**No Security:**
- No authentication
- No authorization
- No encryption
- No rate limiting

### Production Recommendations

**Authentication:**
- JWT tokens
- OAuth 2.0
- API keys

**Authorization:**
- Role-based access control (RBAC)
- Service-to-service authentication
- API Gateway for centralized auth

**Encryption:**
- TLS for all communication
- Encryption at rest
- Secrets management (Vault, AWS Secrets Manager)

**Network Security:**
- Private networks
- Firewall rules
- VPN for admin access

**API Security:**
- Rate limiting
- Input validation
- SQL injection prevention
- XSS prevention

---

## Summary

### Architecture Highlights

1. **Microservices**: Independent, scalable services
2. **Event-Driven**: Kafka for asynchronous communication
3. **Synchronous RPC**: gRPC for critical operations
4. **Database per Service**: Data isolation
5. **Docker**: Containerized deployment
6. **TypeScript**: Type-safe development

### Communication Summary

| Pattern | Technology | Use Case |
|---------|-----------|----------|
| **Synchronous** | gRPC | Critical operations (payment, inventory) |
| **Asynchronous** | Kafka | Event notifications |
| **Request-Response** | REST | Frontend to backend |

### Service Summary

| Service | HTTP | gRPC | Kafka |
|---------|------|------|-------|
| **User** | ✅ | ❌ | Publish |
| **Order** | ✅ | Client | Publish + Consume |
| **Payment** | ✅ | Server | Publish + Consume |
| **Inventory** | ✅ | Server | Publish + Consume |
| **Notification** | ✅ | ❌ | Consume |

**Next Steps:**
- Read [KAFKA_COMPLETE_GUIDE.md](./KAFKA_COMPLETE_GUIDE.md) for Kafka details
- Read [GRPC_COMPLETE_GUIDE.md](./GRPC_COMPLETE_GUIDE.md) for gRPC details
- Read [SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md) for service details
- Read [FRONTEND_TO_BACKEND_FLOW.md](./FRONTEND_TO_BACKEND_FLOW.md) for flow details


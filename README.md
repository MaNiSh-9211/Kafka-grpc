# KALFKA - Kafka + gRPC Microservices Shopping Application

A comprehensive microservices e-commerce application demonstrating **Apache Kafka**, **Zookeeper**, and **gRPC** in a production-ready architecture.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (running)
- Node.js 18+ (for frontend)
- Windows (batch scripts provided)

### Start Everything
```bash
# Install dependencies (first time only)
install.bat

# Start all services
start.bat

# Stop all services
stop.bat
```

### Access Services
- **Frontend**: http://localhost:3000
- **User Service**: http://localhost:5001
- **Order Service**: http://localhost:5002
- **Payment Service**: http://localhost:5003
- **Inventory Service**: http://localhost:5004
- **Notification Service**: http://localhost:5005
- **Kafka**: localhost:9092
- **Zookeeper**: localhost:2181

## 📚 Documentation

This project includes comprehensive documentation covering:

1. **[KAFKA_COMPLETE_GUIDE.md](./KAFKA_COMPLETE_GUIDE.md)** - Complete Kafka guide from basics to advanced topics
2. **[ZOOKEEPER_GUIDE.md](./ZOOKEEPER_GUIDE.md)** - Deep dive into Zookeeper and its role in Kafka
3. **[GRPC_COMPLETE_GUIDE.md](./GRPC_COMPLETE_GUIDE.md)** - Complete gRPC guide from basics to advanced
4. **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)** - Complete project architecture and design decisions
5. **[SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md)** - Detailed documentation of all services, gRPC calls, and Kafka events
6. **[FRONTEND_TO_BACKEND_FLOW.md](./FRONTEND_TO_BACKEND_FLOW.md)** - Complete flow diagrams showing how frontend actions trigger backend operations

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  Port 3000   │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────────────────────────────────────────┐
│           Microservices Layer                    │
├──────────┬──────────┬──────────┬───────────────┤
│   User   │  Order   │ Payment  │  Inventory    │
│ Service  │ Service  │ Service  │   Service     │
│  :5001   │  :5002   │  :5003   │    :5004      │
└────┬──────┴────┬─────┴────┬─────┴──────┬───────┘
     │           │           │            │
     │ gRPC      │ gRPC      │ gRPC       │
     │           │           │            │
     └───────────┴───────────┴────────────┘
                 │
                 │ Kafka Events
                 │
     ┌───────────▼───────────┐
     │   Notification        │
     │   Service :5005       │
     └───────────────────────┘
                 │
     ┌───────────▼───────────┐
     │  Kafka + Zookeeper    │
     │  (Shared Infrastructure)│
     └───────────────────────┘
```

## 🔑 Key Technologies

- **Apache Kafka**: Event streaming platform for asynchronous communication
- **Zookeeper**: Coordination service for Kafka cluster management
- **gRPC**: High-performance RPC framework for synchronous service calls
- **MongoDB**: Database for each service
- **Docker**: Containerization for all services
- **TypeScript**: Type-safe development
- **React**: Frontend framework

## 📖 Learn More

Start with [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for an overview, then dive into the specific guides for Kafka, Zookeeper, and gRPC.

## 🎯 What This Project Demonstrates

- **Event-Driven Architecture**: Services communicate via Kafka events
- **Synchronous RPC**: Critical operations use gRPC for immediate responses
- **Microservices Patterns**: Independent, scalable services
- **Service Mesh**: gRPC for inter-service communication
- **Event Sourcing**: Events as the source of truth
- **CQRS**: Command Query Responsibility Segregation

## 📝 License

This is an educational project demonstrating microservices patterns.


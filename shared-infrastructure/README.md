# Shared Infrastructure - Kafka Only

This directory contains the shared Kafka infrastructure that all microservices connect to.

**Note**: MongoDB is NOT included here. Each service connects to MongoDB using the `MONGODB_URI` environment variable. You can use:
- Local MongoDB (install locally)
- MongoDB Atlas (cloud)
- Any MongoDB instance (just provide the URI)

## Services

### Kafka
- **Broker**: `localhost:9092`
- **Zookeeper**: `localhost:2181`
- **Container**: `kafka-broker`, `kafka-zookeeper`

## Usage

### Start Kafka Infrastructure
```bash
# From root directory
start-shared-infrastructure.bat
# Or
start-kafka-only.bat
```

### Stop Kafka Infrastructure
```bash
stop-shared-infrastructure.bat
# Or
stop-kafka-only.bat
```

### Manual Control
```bash
cd shared-infrastructure
docker-compose up -d        # Start all
docker-compose down         # Stop all
docker-compose logs -f      # View logs
```

## Network

All services use the `shared-network` Docker network for communication.

## Volumes

Data is persisted in Docker volumes:
- `zookeeper-data`, `zookeeper-logs` - Zookeeper data
- `kafka-data` - Kafka data

## MongoDB Setup

MongoDB is NOT managed here. Each service connects via `MONGODB_URI`:

**Option 1: Local MongoDB**
- Install MongoDB locally
- Use: `mongodb://localhost:27017/kafka-shopping-{service-name}`

**Option 2: MongoDB Atlas (Cloud)**
- Create cluster on MongoDB Atlas
- Use connection string: `mongodb+srv://user:pass@cluster.mongodb.net/...`

**Option 3: Docker MongoDB (Separate)**
- Run MongoDB in separate container if needed
- Use: `mongodb://admin:admin123@localhost:27017/...`

Just set `MONGODB_URI` in each service's `.env` file!

## Production Notes

- Use MongoDB Atlas or managed services for production
- Enable Kafka SSL/TLS for production
- Set up proper backup and monitoring


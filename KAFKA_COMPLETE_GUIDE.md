# Apache Kafka - Complete Guide (Basic to Advanced)

## Table of Contents
1. [What is Kafka?](#what-is-kafka)
2. [Core Concepts](#core-concepts)
3. [Architecture Deep Dive](#architecture-deep-dive)
4. [Kafka in This Project](#kafka-in-this-project)
5. [Advanced Topics](#advanced-topics)
6. [Production Best Practices](#production-best-practices)

---

## What is Kafka?

Apache Kafka is a **distributed event streaming platform** that allows you to:
- **Publish** events to topics (like a message queue)
- **Subscribe** to topics and process events (like pub/sub)
- **Store** events durably (like a database)
- **Replay** events (like event sourcing)

### Why Kafka?

**Traditional Approach (Synchronous):**
```
Service A → Service B → Service C
```
- If Service B is down, everything fails
- Tight coupling between services
- Hard to scale

**Kafka Approach (Asynchronous):**
```
Service A → Kafka Topic → Service B
                      → Service C
                      → Service D
```
- Services are decoupled
- If Service B is down, others continue
- Easy to add new consumers
- Events are stored and can be replayed

---

## Core Concepts

### 1. Topics

A **topic** is a category or feed name to which events are published. Think of it as a channel.

**Example Topics in This Project:**
- `user.created` - When a new user is created
- `order.created` - When an order is placed
- `payment.processed` - When payment is successful
- `inventory.updated` - When inventory levels change
- `inventory.low` - When inventory falls below threshold

**Topic Naming Convention:**
- Use dot notation: `service.action` (e.g., `user.created`)
- Use past tense for events: `created`, `updated`, `deleted`
- Be specific: `order.status.updated` not `order.update`

### 2. Partitions

Topics are divided into **partitions** for:
- **Parallelism**: Multiple consumers can process different partitions
- **Scalability**: Distribute load across multiple brokers
- **Ordering**: Messages with the same key go to the same partition

**Example:**
```
Topic: order.created
├── Partition 0: [Order1, Order2, Order3]
├── Partition 1: [Order4, Order5, Order6]
└── Partition 2: [Order7, Order8, Order9]
```

**Key Insight:** Messages with the same key always go to the same partition, ensuring ordering for related messages.

### 3. Producers

A **producer** publishes events to topics.

**In This Project:**
```typescript
// From user-service/src/utils/kafka.ts
const producer = createKafkaProducer();
await producer.connect();

await producer.send('user.created', {
  type: 'user.created',
  userId: '123',
  email: 'user@example.com',
  name: 'John Doe',
  timestamp: new Date().toISOString()
}, 'user-123'); // Key ensures same user events go to same partition
```

**Producer Configuration:**
- **Idempotent**: Prevents duplicate messages (enabled in this project)
- **Acks**: How many brokers must acknowledge (0, 1, or all)
- **Retries**: Automatic retry on failure
- **Compression**: Reduce network usage (gzip, snappy, lz4)

### 4. Consumers

A **consumer** subscribes to topics and processes events.

**In This Project:**
```typescript
// From notification-service/src/kafka.ts
const consumer = createKafkaConsumer('notification-service-group');
await consumer.subscribe(['user.created', 'order.created']);

await consumer.run({
  'user.created': async (event) => {
    // Send welcome email
    await sendWelcomeEmail(event.userId, event.email);
  },
  'order.created': async (event) => {
    // Send order confirmation
    await sendOrderConfirmation(event.orderId, event.userId);
  }
});
```

### 5. Consumer Groups

**Consumer Groups** allow multiple consumers to share the work:
- Each partition is consumed by only **one consumer** in the group
- Allows horizontal scaling
- If a consumer fails, its partitions are reassigned

**Example:**
```
Topic: order.created (3 partitions)
Consumer Group: notification-service-group
├── Consumer 1 → Partition 0
├── Consumer 2 → Partition 1
└── Consumer 3 → Partition 2
```

**In This Project:**
- `user-service-group` - User service consumers
- `order-service-group` - Order service consumers
- `inventory-service-group` - Inventory service consumers
- `payment-service-group` - Payment service consumers
- `notification-service-group` - Notification service consumers

---

## Architecture Deep Dive

### Kafka Cluster Architecture

```
┌─────────────────────────────────────────┐
│         Kafka Cluster                    │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Broker 1 │  │ Broker 2 │  │ Broker 3 ││
│  │          │  │          │  │          ││
│  │ Topic A  │  │ Topic A  │  │ Topic A  ││
│  │ (Part 0) │  │ (Part 1) │  │ (Part 2) ││
│  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────┘
         │
         │
┌────────▼────────┐
│   Zookeeper     │
│  (Coordination) │
└─────────────────┘
```

**In This Project:**
- **Single Broker** (for development): `kafka-broker:29092`
- **Zookeeper**: `kafka-zookeeper:2181`
- **Network**: `shared-network` (Docker network)

### Message Flow

```
1. Producer sends message
   ↓
2. Kafka assigns partition (based on key or round-robin)
   ↓
3. Message stored in partition
   ↓
4. Consumer reads from partition
   ↓
5. Consumer commits offset (marks message as processed)
```

### Offset Management

**Offset** = Position in partition where consumer last read

**Example:**
```
Partition 0: [Msg0, Msg1, Msg2, Msg3, Msg4]
                    ↑
              Consumer offset = 2
              (Next read: Msg3)
```

**Offset Storage:**
- Stored in `__consumer_offsets` topic
- Committed automatically (or manually)
- Allows consumers to resume from last position

---

## Kafka in This Project

### Configuration

**From `shared-infrastructure/docker-compose.yml`:**
```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka-broker:29092
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

**Key Settings:**
- `KAFKA_BROKER_ID`: Unique ID for this broker
- `KAFKA_ZOOKEEPER_CONNECT`: Zookeeper connection string
- `KAFKA_ADVERTISED_LISTENERS`: Addresses clients use to connect
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE`: Auto-create topics when first message is sent

### Producer Implementation

**From `user-service/src/utils/kafka.ts`:**
```typescript
export class KafkaProducer {
  private producer: Producer;
  
  constructor() {
    this.producer = kafka.producer({
      idempotent: true,              // Prevent duplicates
      maxInFlightRequests: 1,        // Required for idempotent
      transactionTimeout: 30000,     // 30 seconds
    });
  }
  
  async send(topic: string, event: any, key?: string): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{
        key: key || null,
        value: JSON.stringify(event),
        headers: {
          'content-type': 'application/json',
          'timestamp': new Date().toISOString(),
        },
      }],
    });
  }
}
```

**Key Features:**
- **Idempotent Producer**: Prevents duplicate messages
- **JSON Serialization**: Events stored as JSON
- **Partition Key**: Optional key for partition assignment
- **Headers**: Metadata (content-type, timestamp)

### Consumer Implementation

**From `notification-service/src/utils/kafka-consumer.ts`:**
```typescript
export function createKafkaConsumer(groupId: string) {
  const consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,      // 30 seconds
    heartbeatInterval: 3000,     // 3 seconds
    maxBytesPerPartition: 1048576, // 1 MB
  });
  
  return {
    connect: () => consumer.connect(),
    subscribe: (topics: string[]) => consumer.subscribe({ topics }),
    run: (handlers: Record<string, Function>) => {
      return consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const event = JSON.parse(message.value?.toString() || '{}');
          const handler = handlers[topic];
          if (handler) {
            await handler(event);
          }
        },
      });
    },
  };
}
```

**Key Features:**
- **Consumer Groups**: Multiple consumers share work
- **Session Timeout**: How long before consumer is considered dead
- **Heartbeat**: Keep-alive signal to broker
- **Error Handling**: Automatic retry and offset management

### Topics in This Project

#### 1. `user.created`
- **Producer**: User Service
- **Consumers**: Order Service, Notification Service
- **Purpose**: Notify other services when a user is created
- **Event Structure**:
```json
{
  "type": "user.created",
  "userId": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. `order.created`
- **Producer**: Order Service
- **Consumers**: Inventory Service, Payment Service, Notification Service
- **Purpose**: Notify services about new orders
- **Event Structure**:
```json
{
  "type": "order.created",
  "orderId": "uuid",
  "userId": "uuid",
  "totalAmount": 99.99,
  "items": [...],
  "paymentId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. `payment.processed`
- **Producer**: Payment Service
- **Consumers**: Order Service, Notification Service
- **Purpose**: Notify about successful payments
- **Event Structure**:
```json
{
  "type": "payment.processed",
  "paymentId": "uuid",
  "orderId": "uuid",
  "amount": 99.99,
  "status": "COMPLETED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 4. `inventory.updated`
- **Producer**: Inventory Service
- **Consumers**: Order Service, Notification Service
- **Purpose**: Notify about inventory changes
- **Event Structure**:
```json
{
  "type": "inventory.updated",
  "productId": "uuid",
  "availableQuantity": 50,
  "reservedQuantity": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 5. `inventory.low`
- **Producer**: Inventory Service
- **Consumers**: Notification Service
- **Purpose**: Alert when inventory is low
- **Event Structure**:
```json
{
  "type": "inventory.low",
  "productId": "uuid",
  "availableQuantity": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Advanced Topics

### 1. Exactly-Once Semantics

**Problem**: Messages might be processed multiple times
**Solution**: Idempotent producer + transactional consumer

**In This Project:**
- Producer is idempotent (prevents duplicates)
- Consumers should be idempotent (safe to process same message twice)

### 2. Consumer Lag

**Consumer Lag** = Number of unprocessed messages

**Monitoring:**
```bash
# Check consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group notification-service-group \
  --describe
```

**High Lag Indicates:**
- Consumers are too slow
- Need more consumers
- Need to optimize processing

### 3. Partitioning Strategy

**Strategy 1: Round-Robin (No Key)**
- Messages distributed evenly
- No ordering guarantee
- Use when: Order doesn't matter

**Strategy 2: Key-Based**
- Messages with same key → same partition
- Ordering guaranteed per key
- Use when: Order matters (e.g., user events)

**In This Project:**
- User events use `userId` as key → all user events in same partition
- Order events use `orderId` as key → all order events in same partition

### 4. Replication

**Replication Factor** = Number of copies of each partition

**Example:**
```
Topic: order.created (Replication Factor: 3)
├── Partition 0: [Broker1, Broker2, Broker3]
├── Partition 1: [Broker2, Broker3, Broker1]
└── Partition 2: [Broker3, Broker1, Broker2]
```

**Benefits:**
- **Fault Tolerance**: If broker fails, data still available
- **High Availability**: Can read from any replica

**In This Project:**
- Single broker (development)
- Production should use replication factor of 3

### 5. Compression

**Compression Types:**
- **gzip**: Best compression, slower
- **snappy**: Good balance
- **lz4**: Fast, less compression

**Benefits:**
- Reduce network usage
- Reduce storage
- Faster transfer

**In This Project:**
- No compression (for simplicity)
- Production should enable compression

### 6. Schema Registry

**Problem**: Schema evolution (adding/removing fields)
**Solution**: Schema Registry (Confluent Schema Registry)

**Benefits:**
- Schema versioning
- Backward/forward compatibility
- Type safety

**In This Project:**
- JSON without schema (for simplicity)
- Production should use Avro + Schema Registry

---

## Production Best Practices

### 1. Topic Configuration

```properties
# Retention (how long to keep messages)
retention.ms=604800000  # 7 days

# Segment size (when to create new segment)
segment.bytes=1073741824  # 1 GB

# Compression
compression.type=snappy

# Replication
min.insync.replicas=2
replication.factor=3
```

### 2. Producer Configuration

```typescript
{
  acks: 'all',                    // Wait for all replicas
  retries: 3,                     // Retry on failure
  maxInFlightRequests: 1,         // For idempotent
  idempotent: true,               // Prevent duplicates
  compression: 'snappy',          // Compress messages
  batchSize: 16384,               // Batch size
  lingerMs: 10,                   // Wait 10ms for batching
}
```

### 3. Consumer Configuration

```typescript
{
  groupId: 'service-group',
  sessionTimeout: 30000,          // 30 seconds
  heartbeatInterval: 3000,        // 3 seconds
  maxBytesPerPartition: 1048576,  // 1 MB
  enableAutoCommit: false,         // Manual commit for exactly-once
  autoCommitInterval: 5000,       // Commit every 5 seconds
}
```

### 4. Monitoring

**Key Metrics:**
- **Producer**: Throughput, latency, errors
- **Consumer**: Lag, throughput, errors
- **Broker**: Disk usage, CPU, network

**Tools:**
- Kafka Manager
- Confluent Control Center
- Prometheus + Grafana

### 5. Error Handling

**Producer Errors:**
- Retry automatically
- Log errors
- Dead letter queue for failed messages

**Consumer Errors:**
- Retry with exponential backoff
- Dead letter queue
- Alert on persistent failures

### 6. Security

**Authentication:**
- SASL/PLAIN
- SASL/SCRAM
- mTLS

**Authorization:**
- ACLs (Access Control Lists)
- RBAC (Role-Based Access Control)

**Encryption:**
- TLS for network encryption
- Encryption at rest

---

## Common Patterns

### 1. Event Sourcing

Store all events, rebuild state from events:
```
User Created → Order Placed → Payment Processed
```

### 2. CQRS (Command Query Responsibility Segregation)

- **Commands**: Write operations (via Kafka)
- **Queries**: Read operations (from database)

### 3. Saga Pattern

Distributed transactions via events:
```
Order Created → Inventory Reserved → Payment Processed
     ↓              ↓                      ↓
  If fails → Release Inventory → Refund Payment
```

### 4. Outbox Pattern

Ensure database and Kafka are consistent:
```
1. Write to database
2. Write event to outbox table
3. Publish event from outbox
4. Delete from outbox
```

---

## Troubleshooting

### Consumer Not Receiving Messages

1. Check consumer group:
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

2. Check consumer lag:
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group your-group --describe
```

3. Check topic exists:
```bash
kafka-topics --bootstrap-server localhost:9092 --list
```

### High Consumer Lag

1. Add more consumers
2. Increase partitions
3. Optimize processing
4. Check for errors

### Messages Not Appearing

1. Check producer errors
2. Check topic configuration
3. Check retention policy
4. Check consumer offset

---

## Summary

Kafka enables:
- **Decoupling**: Services don't need to know about each other
- **Scalability**: Handle millions of messages per second
- **Reliability**: Messages are persisted and can be replayed
- **Flexibility**: Multiple consumers can process same event

**In This Project:**
- Kafka handles all asynchronous communication
- Services publish events when state changes
- Services consume events to react to changes
- Events are the source of truth

**Next Steps:**
- Read [ZOOKEEPER_GUIDE.md](./ZOOKEEPER_GUIDE.md) to understand Zookeeper's role
- Read [SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md) to see how services use Kafka


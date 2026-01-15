# Apache Zookeeper - Complete Guide

## Table of Contents
1. [What is Zookeeper?](#what-is-zookeeper)
2. [Why Kafka Needs Zookeeper](#why-kafka-needs-zookeeper)
3. [Zookeeper Architecture](#zookeeper-architecture)
4. [Zookeeper in This Project](#zookeeper-in-this-project)
5. [Zookeeper Data Model](#zookeeper-data-model)
6. [Zookeeper Operations](#zookeeper-operations)
7. [Kafka's Use of Zookeeper](#kafkas-use-of-zookeeper)
8. [Zookeeper Alternatives](#zookeeper-alternatives)

---

## What is Zookeeper?

Apache Zookeeper is a **distributed coordination service** that provides:
- **Configuration Management**: Centralized configuration
- **Naming Service**: Service discovery
- **Synchronization**: Distributed locks and barriers
- **Group Services**: Leader election, membership

**Think of Zookeeper as:**
- A **distributed file system** for small data
- A **coordination service** for distributed systems
- A **registry** for service discovery

---

## Why Kafka Needs Zookeeper

### The Problem

Kafka is a **distributed system** with multiple brokers. It needs to:
1. **Elect a leader** for each partition
2. **Track broker membership** (which brokers are alive)
3. **Store configuration** (topic settings, ACLs)
4. **Manage consumer offsets** (where consumers left off)

### The Solution: Zookeeper

Zookeeper provides:
- **Leader Election**: Choose partition leaders
- **Service Discovery**: Find available brokers
- **Configuration Storage**: Store cluster metadata
- **Coordination**: Coordinate distributed operations

**Without Zookeeper:**
- Kafka brokers can't coordinate
- No leader election
- No service discovery
- No configuration management

---

## Zookeeper Architecture

### Zookeeper Cluster

```
┌─────────────────────────────────────┐
│      Zookeeper Ensemble              │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │ Server 1 │  │ Server 2 │        │
│  │ (Leader) │  │(Follower)│        │
│  └──────────┘  └──────────┘        │
│         │              │            │
│         └──────┬───────┘            │
│                │                     │
│         ┌──────▼──────┐             │
│         │ Server 3   │             │
│         │(Follower)  │             │
│         └────────────┘             │
└─────────────────────────────────────┘
```

**Key Concepts:**
- **Leader**: Handles all writes
- **Followers**: Handle reads, replicate writes
- **Quorum**: Majority of servers (2 of 3, 3 of 5)

### Zookeeper in This Project

**From `shared-infrastructure/docker-compose.yml`:**
```yaml
zookeeper:
  image: confluentinc/cp-zookeeper:latest
  container_name: kafka-zookeeper
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
  ports:
    - "2181:2181"
```

**Configuration:**
- **Single Node**: Development setup (not production-ready)
- **Port**: 2181 (standard Zookeeper port)
- **Tick Time**: 2000ms (heartbeat interval)

---

## Zookeeper Data Model

### ZNode Tree

Zookeeper stores data in a **hierarchical tree** (like a file system):

```
/
├── /brokers
│   ├── /ids
│   │   ├── /1 (broker metadata)
│   │   └── /2
│   └── /topics
│       ├── /order.created
│       └── /user.created
├── /config
│   ├── /topics
│   └── /clients
└── /consumers
    └── /notification-service-group
        └── /offsets
```

### ZNode Types

1. **Persistent**: Exists until deleted
2. **Ephemeral**: Deleted when session ends
3. **Sequential**: Automatically numbered

**Example:**
```
/brokers/ids/1  (Ephemeral - deleted when broker dies)
/config/topics/order.created  (Persistent - exists until deleted)
```

---

## Zookeeper Operations

### 1. Create

Create a new znode:
```bash
create /path data
```

**Example:**
```bash
create /brokers/ids/1 '{"host":"broker1","port":9092}'
```

### 2. Read

Read znode data:
```bash
get /path
```

**Example:**
```bash
get /brokers/ids/1
```

### 3. Update

Update znode data:
```bash
set /path newdata
```

**Example:**
```bash
set /brokers/ids/1 '{"host":"broker1","port":9093}'
```

### 4. Delete

Delete a znode:
```bash
delete /path
```

**Example:**
```bash
delete /brokers/ids/1
```

### 5. Watch

Watch for changes:
```bash
get /path watch
```

**Example:**
```bash
get /brokers/ids/1 watch
# Notified when broker 1 changes
```

---

## Kafka's Use of Zookeeper

### 1. Broker Registration

**When broker starts:**
1. Broker creates ephemeral znode: `/brokers/ids/{broker-id}`
2. Stores broker metadata (host, port, etc.)
3. If broker dies, znode is automatically deleted

**Zookeeper Path:**
```
/brokers/ids/1
Data: {"host":"kafka-broker","port":9092,"version":4}
```

### 2. Topic Configuration

**Topic metadata stored in Zookeeper:**
```
/config/topics/order.created
Data: {"retention.ms":"604800000","partitions":3}
```

### 3. Partition Leader Election

**Leader election process:**
1. Brokers watch `/brokers/ids` for changes
2. When broker dies, partition leaders are re-elected
3. New leader is chosen based on ISR (In-Sync Replicas)

**Zookeeper Path:**
```
/brokers/topics/order.created/partitions/0/state
Data: {"leader":1,"isr":[1,2,3]}
```

### 4. Consumer Offset Storage (Old)

**Note**: Modern Kafka stores offsets in `__consumer_offsets` topic, but Zookeeper was used in older versions.

**Old Path (not used in this project):**
```
/consumers/{group-id}/offsets/{topic}/{partition}
Data: "12345"  (offset value)
```

### 5. Controller Election

**Kafka Controller:**
- One broker acts as controller
- Manages partition leadership
- Elected via Zookeeper

**Zookeeper Path:**
```
/controller
Data: {"brokerid":1,"version":1}
```

---

## Zookeeper in This Project

### Configuration

**From `shared-infrastructure/docker-compose.yml`:**
```yaml
zookeeper:
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
```

**Key Settings:**
- **ZOOKEEPER_CLIENT_PORT**: Port clients connect to (2181)
- **ZOOKEEPER_TICK_TIME**: Basic time unit (2000ms)
  - Used for session timeout
  - Used for connection timeout

### Kafka Connection

**From `shared-infrastructure/docker-compose.yml`:**
```yaml
kafka:
  environment:
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
```

**Connection String Format:**
```
host1:port1,host2:port2,host3:port3
```

**In This Project:**
- Single Zookeeper: `zookeeper:2181`
- Production: `zk1:2181,zk2:2181,zk3:2181`

### What Kafka Stores in Zookeeper

1. **Broker IDs**: `/brokers/ids/{id}`
2. **Topic Metadata**: `/brokers/topics/{topic}`
3. **Partition State**: `/brokers/topics/{topic}/partitions/{partition}/state`
4. **Controller**: `/controller`
5. **Configuration**: `/config/topics/{topic}`

---

## Zookeeper Alternatives

### KRaft (Kafka Raft)

**KRaft** is Kafka's new metadata management system that **replaces Zookeeper**:

**Benefits:**
- **Simpler**: No external dependency
- **Faster**: Better performance
- **Scalable**: Better scalability
- **Modern**: Future of Kafka

**Status:**
- Available in Kafka 2.8+
- Production-ready in Kafka 3.3+
- Will replace Zookeeper in future versions

**In This Project:**
- Still uses Zookeeper (traditional setup)
- Can be migrated to KRaft in future

### Comparison

| Feature | Zookeeper | KRaft |
|---------|-----------|-------|
| External Dependency | Yes | No |
| Setup Complexity | Medium | Low |
| Performance | Good | Better |
| Scalability | Good | Better |
| Maturity | Very Mature | New |

---

## Zookeeper Best Practices

### 1. Cluster Size

**Rule of Thumb:**
- **3 nodes**: Small clusters (< 10 brokers)
- **5 nodes**: Medium clusters (10-50 brokers)
- **7 nodes**: Large clusters (50+ brokers)

**Why Odd Numbers?**
- Need majority for quorum
- 3 nodes: 2 must agree
- 5 nodes: 3 must agree
- 7 nodes: 4 must agree

### 2. Disk Performance

**Zookeeper is I/O intensive:**
- Use **SSD** for Zookeeper data
- Separate disk for Zookeeper logs
- Monitor disk I/O

### 3. Memory

**Zookeeper keeps data in memory:**
- Default: 1GB heap
- Increase for large clusters
- Monitor memory usage

### 4. Network

**Low latency is critical:**
- Keep Zookeeper close to Kafka
- Use dedicated network
- Monitor network latency

### 5. Monitoring

**Key Metrics:**
- **Request Latency**: Should be < 10ms
- **Connection Count**: Monitor active connections
- **Watch Count**: Monitor active watches
- **Data Size**: Monitor znode tree size

---

## Troubleshooting

### Zookeeper Connection Issues

**Symptoms:**
- Kafka brokers can't connect
- "Connection refused" errors

**Solutions:**
1. Check Zookeeper is running:
```bash
docker ps | grep zookeeper
```

2. Check Zookeeper logs:
```bash
docker logs kafka-zookeeper
```

3. Check port is accessible:
```bash
telnet localhost 2181
```

### Zookeeper Out of Memory

**Symptoms:**
- Zookeeper crashes
- "OutOfMemoryError"

**Solutions:**
1. Increase heap size:
```yaml
environment:
  KAFKA_HEAP_OPTS: "-Xmx2G -Xms2G"
```

2. Reduce data size
3. Add more Zookeeper nodes

### Zookeeper Slow Performance

**Symptoms:**
- High latency
- Timeouts

**Solutions:**
1. Check disk I/O
2. Increase memory
3. Reduce watch count
4. Optimize znode tree

---

## Summary

**Zookeeper's Role:**
- **Coordination**: Coordinates Kafka brokers
- **Metadata**: Stores cluster metadata
- **Leader Election**: Elects partition leaders
- **Service Discovery**: Discovers available brokers

**In This Project:**
- Single Zookeeper node (development)
- Kafka connects to Zookeeper for coordination
- Zookeeper stores broker and topic metadata

**Future:**
- KRaft will replace Zookeeper
- Simpler, faster, more scalable
- No external dependency

**Next Steps:**
- Read [KAFKA_COMPLETE_GUIDE.md](./KAFKA_COMPLETE_GUIDE.md) to understand Kafka
- Read [SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md) to see how services use Kafka


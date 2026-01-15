# gRPC - Complete Guide (Basic to Advanced)

## Table of Contents
1. [What is gRPC?](#what-is-grpc)
2. [Why gRPC?](#why-grpc)
3. [Protocol Buffers](#protocol-buffers)
4. [gRPC Service Types](#grpc-service-types)
5. [gRPC in This Project](#grpc-in-this-project)
6. [Implementation Details](#implementation-details)
7. [Advanced Topics](#advanced-topics)
8. [Best Practices](#best-practices)

---

## What is gRPC?

**gRPC** (gRPC Remote Procedure Calls) is a **high-performance RPC framework** that:
- Uses **Protocol Buffers** for message serialization (binary, faster than JSON)
- Uses **HTTP/2** for transport (multiplexing, header compression)
- Provides **strong typing** with generated code
- Supports **streaming** (client, server, bidirectional)

### Key Features

1. **Language Agnostic**: Works with many languages (TypeScript, Go, Java, Python, etc.)
2. **High Performance**: Binary protocol, HTTP/2, efficient serialization
3. **Strong Typing**: Protocol Buffers provide type safety
4. **Streaming**: Supports streaming requests/responses
5. **Code Generation**: Auto-generates client/server code from `.proto` files

---

## Why gRPC?

### Comparison: REST vs gRPC

| Feature | REST | gRPC |
|---------|------|------|
| **Protocol** | HTTP/1.1 | HTTP/2 |
| **Format** | JSON (text) | Protocol Buffers (binary) |
| **Performance** | Slower | Faster |
| **Type Safety** | Weak | Strong |
| **Streaming** | Limited | Full support |
| **Browser Support** | Native | Requires gRPC-Web |

### When to Use gRPC

**Use gRPC for:**
- ✅ **Inter-service communication** (microservices)
- ✅ **High-performance APIs** (low latency, high throughput)
- ✅ **Real-time streaming** (chat, notifications)
- ✅ **Strong typing** requirements

**Use REST for:**
- ✅ **Public APIs** (browser compatibility)
- ✅ **Simple CRUD** operations
- ✅ **Human-readable** data (JSON)

### In This Project

**gRPC is used for:**
- Order Service → Payment Service (process payment)
- Order Service → Inventory Service (check stock, reserve inventory)

**REST is used for:**
- Frontend → Backend (browser compatibility)
- Public APIs (user management, product listing)

---

## Protocol Buffers

### What are Protocol Buffers?

**Protocol Buffers (protobuf)** are:
- A **language-neutral** data serialization format
- **Binary** (more efficient than JSON)
- **Strongly typed** (schema defines structure)
- **Backward compatible** (can add fields without breaking)

### Proto File Structure

**Example from `payment-service/proto/payment.proto`:**

```protobuf
syntax = "proto3";

package payment;

// Service definition
service PaymentService {
  rpc ProcessPayment (ProcessPaymentRequest) returns (ProcessPaymentResponse);
}

// Request message
message ProcessPaymentRequest {
  string orderId = 1;
  string userId = 2;
  double amount = 3;
  string currency = 4;
  PaymentMethod paymentMethod = 5;
}

// Response message
message ProcessPaymentResponse {
  string paymentId = 1;
  PaymentStatus status = 2;
  string message = 3;
}

// Enum definition
enum PaymentStatus {
  PENDING = 0;
  COMPLETED = 1;
  FAILED = 2;
}
```

### Field Numbers

**Important**: Field numbers (1, 2, 3, etc.) are **permanent**:
- Cannot be changed once used
- Used for backward compatibility
- Should be reserved if removed

**Best Practices:**
- Use 1-15 for frequently used fields (1 byte)
- Use 16-2047 for less frequent fields (2 bytes)
- Reserve deleted field numbers

### Data Types

**Scalar Types:**
- `string`: UTF-8 text
- `int32`, `int64`: Integers
- `double`, `float`: Floating point
- `bool`: Boolean
- `bytes`: Binary data

**Complex Types:**
- `message`: Custom types
- `enum`: Named constants
- `repeated`: Arrays/lists
- `map`: Key-value pairs

---

## gRPC Service Types

### 1. Unary RPC (Request-Response)

**Most common pattern** - one request, one response:

```protobuf
rpc ProcessPayment (ProcessPaymentRequest) returns (ProcessPaymentResponse);
```

**Usage:**
```typescript
const response = await client.processPayment({
  orderId: '123',
  amount: 99.99
});
```

**In This Project:**
- `ProcessPayment` - Process a payment
- `CheckStock` - Check inventory stock
- `ReserveInventory` - Reserve inventory

### 2. Server Streaming

Server sends multiple responses:

```protobuf
rpc GetOrders (GetOrdersRequest) returns (stream Order);
```

**Usage:**
```typescript
const stream = client.getOrders({ userId: '123' });
stream.on('data', (order) => {
  console.log(order);
});
```

**Use Cases:**
- Real-time updates
- Large datasets
- Progress notifications

### 3. Client Streaming

Client sends multiple requests:

```protobuf
rpc CreateOrders (stream Order) returns (CreateOrdersResponse);
```

**Usage:**
```typescript
const stream = client.createOrders();
stream.write({ orderId: '1' });
stream.write({ orderId: '2' });
stream.end();
const response = await stream;
```

**Use Cases:**
- Batch uploads
- Real-time data collection

### 4. Bidirectional Streaming

Both client and server stream:

```protobuf
rpc Chat (stream Message) returns (stream Message);
```

**Usage:**
```typescript
const stream = client.chat();
stream.on('data', (message) => {
  console.log('Received:', message);
});
stream.write({ text: 'Hello' });
```

**Use Cases:**
- Chat applications
- Real-time collaboration
- Gaming

---

## gRPC in This Project

### Services Using gRPC

#### 1. Payment Service (gRPC Server)

**Port**: 50031 (gRPC), 5003 (HTTP)

**Methods:**
- `ProcessPayment` - Process a payment
- `RefundPayment` - Refund a payment
- `GetPaymentStatus` - Get payment status

**Proto File**: `payment-service/proto/payment.proto`

#### 2. Inventory Service (gRPC Server)

**Port**: 50041 (gRPC), 5004 (HTTP)

**Methods:**
- `CheckStock` - Check if product is in stock
- `ReserveInventory` - Reserve inventory for order
- `ReleaseInventory` - Release reserved inventory
- `UpdateInventory` - Update inventory quantity
- `GetInventory` - Get inventory details

**Proto File**: `inventory-service/proto/inventory.proto`

#### 3. Order Service (gRPC Client)

**Calls:**
- Payment Service → `ProcessPayment`
- Inventory Service → `CheckStock`, `ReserveInventory`, `ReleaseInventory`

**Proto Files**: `order-service/proto/payment.proto`, `order-service/proto/inventory.proto`

### Port Configuration

**Why Separate Ports?**

- **HTTP Port**: For REST API (frontend, external clients)
- **gRPC Port**: For inter-service communication (internal)

**In This Project:**
```
Payment Service:
  - HTTP: 5003
  - gRPC: 50031

Inventory Service:
  - HTTP: 5004
  - gRPC: 50041
```

### Network Configuration

**From `order-service/docker-compose.yml`:**
```yaml
environment:
  PAYMENT_SERVICE_URL: payment-service:50031
  INVENTORY_SERVICE_URL: inventory-service:50041
```

**Key Points:**
- Uses **container names** (not localhost)
- Services on same Docker network can communicate directly
- Ports are internal (not exposed to host)

---

## Implementation Details

### Server Implementation

**From `payment-service/src/grpc.ts`:**

```typescript
import * as grpc from '@grpc/grpc-js';
import { loadProto, createServer } from './utils/grpc';

export async function setupGrpcServer(
  payments: Map<string, Payment>,
  kafkaProducer: KafkaProducer
): Promise<void> {
  // Load proto definition
  const PaymentService = loadProto(
    './proto/payment.proto',
    'payment'
  );

  // Create gRPC server
  const grpcServer = createServer();

  // Implement service methods
  grpcServer.addService(PaymentService.PaymentService.service, {
    processPayment: async (call: any, callback: any) => {
      const { orderId, amount } = call.request;
      
      // Process payment
      const paymentId = processPayment(orderId, amount);
      
      // Return response
      callback(null, {
        paymentId,
        status: PaymentStatus.COMPLETED,
        message: 'Success'
      });
    }
  });

  // Start server
  grpcServer.bindAsync(
    '0.0.0.0:50031',
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) throw error;
      grpcServer.start();
    }
  );
}
```

**Key Steps:**
1. **Load Proto**: Parse `.proto` file
2. **Create Server**: Create gRPC server instance
3. **Add Service**: Implement service methods
4. **Bind & Start**: Bind to port and start server

### Client Implementation

**From `order-service/src/utils/grpc.ts`:**

```typescript
import * as grpc from '@grpc/grpc-js';
import { loadProto, createClient } from './utils/grpc';

export async function setupGrpcClients(): Promise<void> {
  // Load Payment Service proto
  const PaymentService = loadProto(
    './proto/payment.proto',
    'payment'
  );

  // Create client
  paymentClient = createClient(
    PaymentService.PaymentService,
    'payment-service:50031'
  );
}

// Use client
export async function processPayment(
  orderId: string,
  amount: number
): Promise<{ paymentId: string }> {
  const processPaymentMethod = promisify(
    paymentClient.processPayment.bind(paymentClient)
  );

  const response = await processPaymentMethod({
    orderId,
    amount,
    currency: 'USD'
  });

  return {
    paymentId: response.paymentId
  };
}
```

**Key Steps:**
1. **Load Proto**: Parse `.proto` file
2. **Create Client**: Create gRPC client instance
3. **Promisify**: Convert callback to Promise
4. **Call Method**: Make RPC call

### Proto Loading

**From `payment-service/src/utils/grpc.ts`:**

```typescript
import * as protoLoader from '@grpc/proto-loader';

function loadProto(protoPath: string, packageName: string): any {
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,        // Keep field names as-is
    longs: String,         // Convert 64-bit to string
    enums: String,         // Convert enums to string
    defaults: true,        // Use default values
    oneofs: true,         // Handle oneof fields
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);
  return proto[packageName];
}
```

**Options Explained:**
- `keepCase`: Preserve field names (don't convert to camelCase)
- `longs: String`: JavaScript can't handle 64-bit integers, convert to string
- `enums: String`: Convert enum values to strings
- `defaults: true`: Use default values for missing fields
- `oneofs: true`: Handle oneof fields (mutually exclusive fields)

---

## Advanced Topics

### 1. Error Handling

**gRPC Status Codes:**
- `OK` (0): Success
- `CANCELLED` (1): Operation cancelled
- `INVALID_ARGUMENT` (3): Invalid argument
- `NOT_FOUND` (5): Resource not found
- `ALREADY_EXISTS` (6): Resource already exists
- `PERMISSION_DENIED` (7): Permission denied
- `RESOURCE_EXHAUSTED` (8): Resource exhausted
- `FAILED_PRECONDITION` (9): Precondition failed
- `ABORTED` (10): Operation aborted
- `OUT_OF_RANGE` (11): Out of range
- `UNIMPLEMENTED` (12): Not implemented
- `INTERNAL` (13): Internal error
- `UNAVAILABLE` (14): Service unavailable
- `DATA_LOSS` (15): Data loss
- `UNAUTHENTICATED` (16): Unauthenticated

**In This Project:**
```typescript
// Server returns error
callback({
  code: grpc.status.NOT_FOUND,
  message: 'Product not found'
});

// Client handles error
try {
  const response = await checkStock(productId, quantity);
} catch (error) {
  if (error.code === grpc.status.NOT_FOUND) {
    // Handle not found
  }
}
```

### 2. Timeouts

**Set timeout on client:**
```typescript
const client = createClient(Service, 'localhost:50031', {
  deadline: Date.now() + 5000  // 5 second timeout
});
```

**In This Project:**
- Default timeout: 30 seconds
- Can be configured per call

### 3. Retries

**Automatic retries:**
```typescript
const client = createClient(Service, 'localhost:50031', {
  retry: {
    maxRetries: 3,
    initialBackoff: 1000,
    maxBackoff: 5000
  }
});
```

**Retryable Errors:**
- `UNAVAILABLE`: Service temporarily unavailable
- `DEADLINE_EXCEEDED`: Request timeout
- `RESOURCE_EXHAUSTED`: Rate limited

### 4. Compression

**Enable compression:**
```typescript
const client = createClient(Service, 'localhost:50031', {
  compression: 'gzip'
});
```

**Compression Types:**
- `gzip`: Best compression
- `deflate`: Good compression
- `identity`: No compression

### 5. Interceptors

**Add interceptors for logging, auth, etc.:**
```typescript
const interceptor = (options: any, nextCall: any) => {
  return new grpc.InterceptingCall(nextCall(options), {
    start: (metadata, listener, next) => {
      // Add metadata (e.g., auth token)
      metadata.add('authorization', 'Bearer token');
      next(metadata, listener);
    }
  });
};

const client = createClient(Service, 'localhost:50031', {
  interceptors: [interceptor]
});
```

### 6. Metadata

**Send metadata (headers):**
```typescript
const metadata = new grpc.Metadata();
metadata.add('authorization', 'Bearer token');
metadata.add('request-id', '123');

const response = await client.processPayment(request, metadata);
```

**Receive metadata:**
```typescript
grpcServer.addService(Service.service, {
  processPayment: (call: any, callback: any) => {
    const auth = call.metadata.get('authorization');
    // Process request
  }
});
```

---

## Best Practices

### 1. Proto Design

**✅ DO:**
- Use descriptive names
- Use appropriate field numbers
- Document messages and fields
- Use enums for constants
- Version your APIs

**❌ DON'T:**
- Change field numbers
- Remove fields (mark as deprecated)
- Use generic names
- Skip documentation

### 2. Error Handling

**✅ DO:**
- Use appropriate status codes
- Provide error messages
- Log errors server-side
- Handle errors client-side

**❌ DON'T:**
- Return generic errors
- Expose internal details
- Ignore errors

### 3. Performance

**✅ DO:**
- Use streaming for large data
- Enable compression
- Batch requests when possible
- Use connection pooling

**❌ DON'T:**
- Make many small calls
- Send unnecessary data
- Ignore timeouts
- Block on calls

### 4. Security

**✅ DO:**
- Use TLS for encryption
- Authenticate requests
- Validate input
- Rate limit

**❌ DON'T:**
- Use insecure credentials
- Trust client input
- Expose sensitive data
- Skip authentication

---

## Summary

**gRPC provides:**
- **High Performance**: Binary protocol, HTTP/2
- **Strong Typing**: Protocol Buffers
- **Language Agnostic**: Works with many languages
- **Streaming**: Full streaming support

**In This Project:**
- gRPC used for **inter-service communication**
- REST used for **frontend communication**
- Separate ports for HTTP and gRPC
- Protocol Buffers define service contracts

**Next Steps:**
- Read [SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md) to see all gRPC calls
- Read [FRONTEND_TO_BACKEND_FLOW.md](./FRONTEND_TO_BACKEND_FLOW.md) to see how frontend triggers gRPC calls


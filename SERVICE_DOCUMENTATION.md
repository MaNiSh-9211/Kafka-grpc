# Service Documentation - Complete Guide

## Table of Contents
1. [User Service](#user-service)
2. [Order Service](#order-service)
3. [Payment Service](#payment-service)
4. [Inventory Service](#inventory-service)
5. [Notification Service](#notification-service)
6. [Service Interactions](#service-interactions)
7. [Complete Flow Diagrams](#complete-flow-diagrams)

---

## User Service

### Overview
- **Port**: 5001 (HTTP)
- **Database**: MongoDB (`user-management`)
- **Purpose**: User management (CRUD operations)

### HTTP Endpoints

#### 1. Create User
- **Endpoint**: `POST /users`
- **Trigger**: Frontend form submission, API call
- **Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "address": "123 Main St",
  "phone": "+1234567890"
}
```
- **Response**:
```json
{
  "service": "user-service",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**What Happens:**
1. Validates input (email, name required)
2. Checks if user already exists
3. Hashes password (if provided)
4. Creates user in MongoDB
5. **Publishes `user.created` event to Kafka**
6. Returns user data

#### 2. Get All Users
- **Endpoint**: `GET /users`
- **Trigger**: Frontend page load, API call
- **Query Params**: `page`, `limit`, `search`
- **Response**: List of users with pagination

#### 3. Get User by ID
- **Endpoint**: `GET /users/:id`
- **Trigger**: Frontend navigation, API call
- **Response**: Single user object

#### 4. Update User
- **Endpoint**: `PUT /users/:id`
- **Trigger**: Frontend form submission
- **Request Body**: Partial user data
- **What Happens**:
  1. Updates user in MongoDB
  2. **Publishes `user.updated` event to Kafka**
  3. Returns updated user

#### 5. Delete User
- **Endpoint**: `DELETE /users/:id`
- **Trigger**: Frontend delete action
- **What Happens**:
  1. Deletes user from MongoDB
  2. **Publishes `user.deleted` event to Kafka**
  3. Returns success

### Kafka Events Published

#### `user.created`
- **When**: After user is successfully created
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
- **Consumers**: Order Service, Notification Service
- **Partition Key**: `userId` (ensures all user events in same partition)

#### `user.updated`
- **When**: After user is updated
- **Event Structure**:
```json
{
  "type": "user.updated",
  "userId": "uuid",
  "changes": { "name": "Jane Doe" },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service

#### `user.deleted`
- **When**: After user is deleted
- **Event Structure**:
```json
{
  "type": "user.deleted",
  "userId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service

### Kafka Events Consumed
- **None** (User Service only publishes events)

### gRPC Calls
- **None** (User Service doesn't make gRPC calls)

---

## Order Service

### Overview
- **Port**: 5002 (HTTP), Client for gRPC
- **Database**: In-memory (for demo), MongoDB in production
- **Purpose**: Order management, orchestrates payment and inventory

### HTTP Endpoints

#### 1. Create Order
- **Endpoint**: `POST /orders`
- **Trigger**: Frontend checkout, API call
- **Request Body**:
```json
{
  "userId": "uuid",
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "price": 29.99
    }
  ]
}
```
- **Response**:
```json
{
  "service": "order-service",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "items": [...],
    "totalAmount": 59.98,
    "status": "CONFIRMED",
    "paymentId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Complete Flow:**
1. **Validate input** (userId, items required)
2. **Calculate total amount**
3. **gRPC Call**: `InventoryService.CheckStock` for each item
   - If out of stock → return error
4. **gRPC Call**: `InventoryService.ReserveInventory` for each item
   - Creates reservation
   - Reduces available quantity
5. **gRPC Call**: `PaymentService.ProcessPayment`
   - Processes payment
   - Returns paymentId
6. **Create order** in memory/database
7. **Publish `order.created` event to Kafka**
8. Return order data

#### 2. Get All Orders
- **Endpoint**: `GET /orders`
- **Trigger**: Frontend page load
- **Query Params**: `userId`, `status`, `page`, `limit`
- **Response**: List of orders

#### 3. Get Order by ID
- **Endpoint**: `GET /orders/:id`
- **Trigger**: Frontend navigation
- **Response**: Single order object

#### 4. Update Order Status
- **Endpoint**: `PUT /orders/:id/status`
- **Trigger**: Admin action, payment confirmation
- **Request Body**:
```json
{
  "status": "SHIPPED"
}
```
- **What Happens**:
  1. Updates order status
  2. **Publishes `order.status.updated` event to Kafka**
  3. Returns updated order

#### 5. Cancel Order
- **Endpoint**: `DELETE /orders/:id`
- **Trigger**: User cancellation, admin action
- **What Happens**:
  1. Updates order status to CANCELLED
  2. **gRPC Call**: `InventoryService.ReleaseInventory` for each item
  3. **Publishes `order.cancelled` event to Kafka**
  4. Returns success

### Kafka Events Published

#### `order.created`
- **When**: After order is successfully created
- **Event Structure**:
```json
{
  "type": "order.created",
  "orderId": "uuid",
  "userId": "uuid",
  "totalAmount": 99.99,
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "paymentId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Inventory Service, Payment Service, Notification Service
- **Partition Key**: `orderId`

#### `order.status.updated`
- **When**: After order status changes
- **Event Structure**:
```json
{
  "type": "order.status.updated",
  "orderId": "uuid",
  "userId": "uuid",
  "status": "SHIPPED",
  "previousStatus": "CONFIRMED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Notification Service
- **Partition Key**: `orderId`

#### `order.cancelled`
- **When**: After order is cancelled
- **Event Structure**:
```json
{
  "type": "order.cancelled",
  "orderId": "uuid",
  "userId": "uuid",
  "reason": "User requested",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Inventory Service, Notification Service
- **Partition Key**: `orderId`

### Kafka Events Consumed

#### `user.created`
- **Handler**: Logs event, can initialize user order history
- **Source**: User Service

#### `inventory.updated`
- **Handler**: Logs event, can notify users about stock updates
- **Source**: Inventory Service

#### `payment.processed`
- **Handler**: Updates order status based on payment result
- **Source**: Payment Service

### gRPC Calls Made

#### 1. `InventoryService.CheckStock`
- **When**: Before creating order (validate stock)
- **Request**:
```typescript
{
  productId: "prod-1",
  quantity: 2
}
```
- **Response**:
```typescript
{
  productId: "prod-1",
  inStock: true,
  availableQuantity: 50,
  reservedQuantity: 10
}
```
- **Error Handling**: If `inStock: false`, return error to client

#### 2. `InventoryService.ReserveInventory`
- **When**: After stock check passes (reserve items)
- **Request**:
```typescript
{
  orderId: "uuid",
  productId: "prod-1",
  quantity: 2
}
```
- **Response**:
```typescript
{
  reservationId: "uuid",
  success: true,
  message: "Inventory reserved successfully"
}
```
- **Error Handling**: If fails, rollback and return error

#### 3. `InventoryService.ReleaseInventory`
- **When**: Order cancellation, payment failure
- **Request**:
```typescript
{
  reservationId: "uuid",
  orderId: "uuid"
}
```
- **Response**:
```typescript
{
  success: true,
  message: "Inventory released successfully"
}
```

#### 4. `PaymentService.ProcessPayment`
- **When**: After inventory is reserved (process payment)
- **Request**:
```typescript
{
  orderId: "uuid",
  userId: "uuid",
  amount: 99.99,
  currency: "USD",
  paymentMethod: 0,  // CREDIT_CARD
  cardNumber: "****1234"
}
```
- **Response**:
```typescript
{
  paymentId: "uuid",
  status: "COMPLETED",
  message: "Payment processed successfully",
  timestamp: 1234567890
}
```
- **Error Handling**: If fails, release inventory and return error

---

## Payment Service

### Overview
- **Port**: 5003 (HTTP), 50031 (gRPC)
- **Database**: In-memory (for demo), MongoDB in production
- **Purpose**: Payment processing

### HTTP Endpoints

#### 1. Get All Payments
- **Endpoint**: `GET /payments`
- **Trigger**: Frontend page load, API call
- **Response**: List of payments

#### 2. Get Payment by ID
- **Endpoint**: `GET /payments/:id`
- **Trigger**: Frontend navigation
- **Response**: Single payment object

#### 3. Process Payment (REST)
- **Endpoint**: `POST /payments`
- **Trigger**: Direct API call (not used by frontend)
- **Request Body**:
```json
{
  "orderId": "uuid",
  "userId": "uuid",
  "amount": 99.99,
  "currency": "USD"
}
```

### gRPC Methods (Server)

#### 1. `ProcessPayment`
- **When**: Called by Order Service during order creation
- **Request**:
```typescript
{
  orderId: "uuid",
  userId: "uuid",
  amount: 99.99,
  currency: "USD",
  paymentMethod: 0,  // CREDIT_CARD
  cardNumber: "****1234"
}
```
- **Response**:
```typescript
{
  paymentId: "uuid",
  status: "COMPLETED",
  message: "Payment processed successfully",
  timestamp: 1234567890
}
```
- **What Happens**:
  1. Creates payment record
  2. Processes payment (simulated)
  3. **Publishes `payment.processed` event to Kafka**
  4. Returns payment result

#### 2. `RefundPayment`
- **When**: Called for refunds
- **Request**:
```typescript
{
  paymentId: "uuid",
  amount: 99.99,
  reason: "Order cancelled"
}
```
- **Response**:
```typescript
{
  refundId: "uuid",
  success: true,
  message: "Refund processed successfully"
}
```
- **What Happens**:
  1. Validates payment exists
  2. Processes refund
  3. **Publishes `payment.refunded` event to Kafka**
  4. Returns refund result

#### 3. `GetPaymentStatus`
- **When**: Check payment status
- **Request**:
```typescript
{
  paymentId: "uuid"
}
```
- **Response**:
```typescript
{
  paymentId: "uuid",
  status: "COMPLETED",
  amount: 99.99,
  timestamp: 1234567890
}
```

### Kafka Events Published

#### `payment.processed`
- **When**: After payment is processed
- **Event Structure**:
```json
{
  "type": "payment.processed",
  "paymentId": "uuid",
  "orderId": "uuid",
  "userId": "uuid",
  "amount": 99.99,
  "status": "COMPLETED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service, Notification Service
- **Partition Key**: `paymentId`

#### `payment.failed`
- **When**: Payment processing fails
- **Event Structure**:
```json
{
  "type": "payment.failed",
  "paymentId": "uuid",
  "orderId": "uuid",
  "userId": "uuid",
  "amount": 99.99,
  "reason": "Insufficient funds",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service, Notification Service

#### `payment.refunded`
- **When**: Payment is refunded
- **Event Structure**:
```json
{
  "type": "payment.refunded",
  "paymentId": "uuid",
  "refundId": "uuid",
  "amount": 99.99,
  "reason": "Order cancelled",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service, Notification Service

### Kafka Events Consumed

#### `order.created`
- **Handler**: Logs event, can process payment asynchronously
- **Source**: Order Service

### gRPC Calls Made
- **None** (Payment Service only receives gRPC calls)

---

## Inventory Service

### Overview
- **Port**: 5004 (HTTP), 50041 (gRPC)
- **Database**: MongoDB (`inventory-management`)
- **Purpose**: Product inventory management

### HTTP Endpoints

#### 1. Get All Products
- **Endpoint**: `GET /products`
- **Trigger**: Frontend home page, product listing
- **Query Params**: `category`, `search`, `page`, `limit`
- **Response**: List of products with pagination

#### 2. Get Product by ID
- **Endpoint**: `GET /products/:id`
- **Trigger**: Frontend product detail page
- **Response**: Single product object

#### 3. Create Product
- **Endpoint**: `POST /products`
- **Trigger**: Admin action, API call
- **Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "totalQuantity": 100,
  "category": "Electronics",
  "brand": "Brand Name"
}
```

#### 4. Update Product
- **Endpoint**: `PUT /products/:id`
- **Trigger**: Admin action
- **Request Body**: Partial product data

#### 5. Get Reservations
- **Endpoint**: `GET /reservations`
- **Trigger**: Admin view, API call
- **Response**: List of reservations

### gRPC Methods (Server)

#### 1. `CheckStock`
- **When**: Called by Order Service before creating order
- **Request**:
```typescript
{
  productId: "prod-1",
  quantity: 2
}
```
- **Response**:
```typescript
{
  productId: "prod-1",
  inStock: true,
  availableQuantity: 50,
  reservedQuantity: 10
}
```
- **What Happens**:
  1. Finds product in database
  2. Checks if `availableQuantity >= quantity`
  3. Returns stock information

#### 2. `ReserveInventory`
- **When**: Called by Order Service after stock check
- **Request**:
```typescript
{
  orderId: "uuid",
  productId: "prod-1",
  quantity: 2
}
```
- **Response**:
```typescript
{
  reservationId: "uuid",
  success: true,
  message: "Inventory reserved successfully"
}
```
- **What Happens**:
  1. Validates product exists and has stock
  2. Creates reservation record
  3. Updates product: `availableQuantity -= quantity`, `reservedQuantity += quantity`
  4. **Publishes `inventory.updated` event to Kafka**
  5. If `availableQuantity < 10`, **publishes `inventory.low` event**
  6. Returns reservation ID

#### 3. `ReleaseInventory`
- **When**: Called by Order Service on cancellation
- **Request**:
```typescript
{
  reservationId: "uuid",
  orderId: "uuid"
}
```
- **Response**:
```typescript
{
  success: true,
  message: "Inventory released successfully"
}
```
- **What Happens**:
  1. Finds reservation
  2. Validates orderId matches
  3. Updates product: `availableQuantity += quantity`, `reservedQuantity -= quantity`
  4. Marks reservation as RELEASED
  5. **Publishes `inventory.updated` event to Kafka**

#### 4. `UpdateInventory`
- **When**: Admin action, stock adjustment
- **Request**:
```typescript
{
  productId: "prod-1",
  quantity: 50,
  updateType: 0  // SET, ADD, or SUBTRACT
}
```
- **Response**:
```typescript
{
  productId: "prod-1",
  newQuantity: 150,
  success: true
}
```

#### 5. `GetInventory`
- **When**: Check inventory details
- **Request**:
```typescript
{
  productId: "prod-1"
}
```
- **Response**:
```typescript
{
  productId: "prod-1",
  productName: "Product Name",
  totalQuantity: 100,
  availableQuantity: 50,
  reservedQuantity: 10
}
```

### Kafka Events Published

#### `inventory.updated`
- **When**: After inventory changes (reserve, release, update)
- **Event Structure**:
```json
{
  "type": "inventory.updated",
  "productId": "prod-1",
  "quantity": 90,
  "availableQuantity": 50,
  "reservedQuantity": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Order Service, Notification Service
- **Partition Key**: `productId`

#### `inventory.low`
- **When**: When `availableQuantity < 10`
- **Event Structure**:
```json
{
  "type": "inventory.low",
  "productId": "prod-1",
  "availableQuantity": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
- **Consumers**: Notification Service
- **Partition Key**: `productId`

### Kafka Events Consumed

#### `order.created`
- **Handler**: Logs event (inventory already reserved via gRPC)
- **Source**: Order Service

#### `order.cancelled`
- **Handler**: Releases inventory for cancelled order
- **Source**: Order Service
- **What Happens**:
  1. Finds all reservations for order
  2. Releases each reservation
  3. Updates product quantities
  4. **Publishes `inventory.updated` event**

### gRPC Calls Made
- **None** (Inventory Service only receives gRPC calls)

---

## Notification Service

### Overview
- **Port**: 5005 (HTTP)
- **Database**: MongoDB (`notification-management`)
- **Purpose**: Send notifications based on events

### HTTP Endpoints

#### 1. Get All Notifications
- **Endpoint**: `GET /notifications`
- **Trigger**: Frontend page load, API call
- **Query Params**: `userId`, `type`, `status`
- **Response**: List of notifications

#### 2. Get Notification by ID
- **Endpoint**: `GET /notifications/:id`
- **Trigger**: Frontend navigation
- **Response**: Single notification object

#### 3. Get User Notifications
- **Endpoint**: `GET /notifications/user/:userId`
- **Trigger**: Frontend user dashboard
- **Response**: List of notifications for user

### Kafka Events Consumed

#### `user.created`
- **Handler**: Sends welcome email
- **Source**: User Service
- **What Happens**:
  1. Creates notification record
  2. Sends welcome email
  3. Updates notification status

#### `order.created`
- **Handler**: Sends order confirmation email
- **Source**: Order Service
- **What Happens**:
  1. Creates notification record
  2. Sends order confirmation email
  3. Updates notification status

#### `order.status.updated`
- **Handler**: Sends order status update email
- **Source**: Order Service
- **What Happens**:
  1. Creates notification record
  2. Sends status update email
  3. Updates notification status

#### `order.completed`
- **Handler**: Sends order completion email
- **Source**: Order Service
- **What Happens**:
  1. Creates notification record
  2. Sends completion email
  3. Updates notification status

#### `payment.processed`
- **Handler**: Sends payment confirmation or failure email
- **Source**: Payment Service
- **What Happens**:
  1. Checks payment status
  2. Creates notification record
  3. Sends appropriate email (success or failure)
  4. Updates notification status

#### `payment.failed`
- **Handler**: Sends payment failure email
- **Source**: Payment Service

#### `payment.refunded`
- **Handler**: Sends refund confirmation email
- **Source**: Payment Service

#### `inventory.updated`
- **Handler**: Logs event (can send stock update notifications)
- **Source**: Inventory Service

#### `inventory.low`
- **Handler**: Sends low stock alert to admin
- **Source**: Inventory Service
- **What Happens**:
  1. Creates notification record (userId: 'admin')
  2. Sends low stock alert email
  3. Updates notification status

### Kafka Events Published
- **None** (Notification Service only consumes events)

### gRPC Calls Made
- **None** (Notification Service doesn't make gRPC calls)

---

## Service Interactions

### Complete Order Flow

```
1. Frontend → Order Service (HTTP POST /orders)
   ↓
2. Order Service → Inventory Service (gRPC CheckStock)
   ← Returns: inStock: true
   ↓
3. Order Service → Inventory Service (gRPC ReserveInventory)
   ← Returns: reservationId
   ↓
4. Order Service → Payment Service (gRPC ProcessPayment)
   ← Returns: paymentId
   ↓
5. Order Service creates order
   ↓
6. Order Service → Kafka (publishes order.created)
   ↓
7. Inventory Service ← Kafka (consumes order.created, logs)
   ↓
8. Payment Service ← Kafka (consumes order.created, logs)
   ↓
9. Notification Service ← Kafka (consumes order.created)
   → Sends order confirmation email
   ↓
10. Payment Service → Kafka (publishes payment.processed)
   ↓
11. Order Service ← Kafka (consumes payment.processed)
   → Updates order status
   ↓
12. Notification Service ← Kafka (consumes payment.processed)
   → Sends payment confirmation email
```

### Order Cancellation Flow

```
1. Frontend → Order Service (HTTP DELETE /orders/:id)
   ↓
2. Order Service → Inventory Service (gRPC ReleaseInventory)
   ← Returns: success
   ↓
3. Inventory Service updates quantities
   ↓
4. Inventory Service → Kafka (publishes inventory.updated)
   ↓
5. Order Service → Kafka (publishes order.cancelled)
   ↓
6. Inventory Service ← Kafka (consumes order.cancelled)
   → Releases any remaining reservations
   ↓
7. Notification Service ← Kafka (consumes order.cancelled)
   → Sends cancellation email
```

---

## Summary

### Communication Patterns

**Synchronous (gRPC):**
- Order Service → Payment Service (ProcessPayment)
- Order Service → Inventory Service (CheckStock, ReserveInventory, ReleaseInventory)

**Asynchronous (Kafka):**
- All services publish events when state changes
- Notification Service consumes all events
- Services react to events from other services

### Port Summary

| Service | HTTP Port | gRPC Port |
|---------|-----------|-----------|
| User Service | 5001 | - |
| Order Service | 5002 | Client only |
| Payment Service | 5003 | 50031 |
| Inventory Service | 5004 | 50041 |
| Notification Service | 5005 | - |

### Event Summary

| Event | Producer | Consumers |
|-------|----------|-----------|
| `user.created` | User Service | Order Service, Notification Service |
| `user.updated` | User Service | Order Service |
| `user.deleted` | User Service | Order Service |
| `order.created` | Order Service | Inventory Service, Payment Service, Notification Service |
| `order.status.updated` | Order Service | Notification Service |
| `order.cancelled` | Order Service | Inventory Service, Notification Service |
| `payment.processed` | Payment Service | Order Service, Notification Service |
| `payment.failed` | Payment Service | Order Service, Notification Service |
| `payment.refunded` | Payment Service | Order Service, Notification Service |
| `inventory.updated` | Inventory Service | Order Service, Notification Service |
| `inventory.low` | Inventory Service | Notification Service |

**Next Steps:**
- Read [FRONTEND_TO_BACKEND_FLOW.md](./FRONTEND_TO_BACKEND_FLOW.md) to see how frontend actions trigger these flows
- Read [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for architecture details


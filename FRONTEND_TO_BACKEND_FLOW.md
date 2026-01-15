# Frontend to Backend Flow - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Home Page Flow](#home-page-flow)
3. [Product Detail Flow](#product-detail-flow)
4. [Cart Management Flow](#cart-management-flow)
5. [Checkout Flow](#checkout-flow)
6. [Order Flow](#order-flow)
7. [User Management Flow](#user-management-flow)
8. [Complete User Journey](#complete-user-journey)

---

## Overview

This document explains how **frontend actions trigger backend operations**, including:
- HTTP REST API calls
- gRPC calls between services
- Kafka event publishing and consumption
- Complete request-response cycles

### Frontend Architecture

```
Frontend (React + Vite)
├── Port: 3000
├── API Calls: Direct HTTP to services
└── State Management: React hooks + localStorage
```

### API Endpoints Used

| Service | Base URL | Port |
|---------|----------|------|
| User Service | `http://localhost:5001` | 5001 |
| Order Service | `http://localhost:5002` | 5002 |
| Payment Service | `http://localhost:5003` | 5003 |
| Inventory Service | `http://localhost:5004` | 5004 |
| Notification Service | `http://localhost:5005` | 5005 |

---

## Home Page Flow

### User Action: Page Load

**Frontend Code**: `frontend/src/pages/Home.tsx`

```typescript
useEffect(() => {
  fetchProducts()
}, [])

const fetchProducts = async () => {
  const res = await axios.get(`${INVENTORY_API}/products`, {
    timeout: 10000
  })
  setProducts(res.data?.data || res.data || [])
}
```

### Complete Flow

```
1. User opens home page
   ↓
2. Frontend: useEffect triggers fetchProducts()
   ↓
3. Frontend → Inventory Service (HTTP GET /products)
   Request: GET http://localhost:5004/products
   ↓
4. Inventory Service: Queries MongoDB for products
   ↓
5. Inventory Service → Frontend (HTTP 200)
   Response: { service: "inventory-service", data: [...products] }
   ↓
6. Frontend: Updates state, renders products
```

### What Happens in Inventory Service

**Code**: `inventory-service/src/routes.ts`

```typescript
app.get('/products', async (req, res) => {
  const { category, search, page, limit } = req.query;
  
  // Query MongoDB
  const products = await Product.find(query)
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });
  
  res.json({
    service: 'inventory-service',
    data: products,
    pagination: { page, limit, total, pages }
  });
});
```

**No gRPC calls, no Kafka events** - Simple REST API call.

---

## Product Detail Flow

### User Action: Click Product

**Frontend Code**: `frontend/src/pages/ProductDetail.tsx`

```typescript
useEffect(() => {
  if (id) {
    fetchProduct(id)
  }
}, [id])

const fetchProduct = async (productId: string) => {
  const res = await axios.get(`${INVENTORY_API}/products/${productId}`)
  setProduct(res.data?.data || res.data)
}
```

### Complete Flow

```
1. User clicks product on home page
   ↓
2. Frontend: Navigates to /products/:id
   ↓
3. Frontend: useEffect triggers fetchProduct(id)
   ↓
4. Frontend → Inventory Service (HTTP GET /products/:id)
   Request: GET http://localhost:5004/products/prod-1
   ↓
5. Inventory Service: Queries MongoDB for product
   ↓
6. Inventory Service → Frontend (HTTP 200)
   Response: { service: "inventory-service", data: {...product} }
   ↓
7. Frontend: Renders product details
```

### Add to Cart Flow

**User Action**: Click "Add to Cart" button

```typescript
const addToCart = () => {
  if (!product) return
  
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const existingItem = cart.find((item: CartItem) => item.productId === product.id)
  
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity
    })
  }
  
  localStorage.setItem('cart', JSON.stringify(cart))
  navigate('/cart')
}
```

**No backend call** - Cart stored in localStorage (client-side only).

---

## Cart Management Flow

### User Action: View Cart

**Frontend Code**: `frontend/src/pages/Cart.tsx`

```typescript
useEffect(() => {
  loadCart()
}, [])

const loadCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  setCartItems(cart)
}
```

**No backend call** - Cart is client-side only.

### User Action: Update Quantity

```typescript
const updateQuantity = (productId: string, newQuantity: number) => {
  const updatedCart = cartItems.map(item =>
    item.productId === productId
      ? { ...item, quantity: newQuantity }
      : item
  )
  setCartItems(updatedCart)
  localStorage.setItem('cart', JSON.stringify(updatedCart))
}
```

**No backend call** - All cart operations are client-side.

### User Action: Remove Item

```typescript
const removeItem = (productId: string) => {
  const updatedCart = cartItems.filter(item => item.productId !== productId)
  setCartItems(updatedCart)
  localStorage.setItem('cart', JSON.stringify(updatedCart))
}
```

**No backend call** - Client-side only.

---

## Checkout Flow

### User Action: Click "Proceed to Checkout"

**Frontend Code**: `frontend/src/pages/Checkout.tsx`

### Step 1: Load Cart and User

```typescript
useEffect(() => {
  loadCart()
  loadUserId()
}, [])

const loadCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  setCartItems(cart)
}

const loadUserId = () => {
  const savedUserId = localStorage.getItem('userId')
  if (savedUserId) {
    setUserId(savedUserId)
  } else {
    createTempUser()  // Creates guest user
  }
}
```

### Step 2: Create Guest User (if needed)

```typescript
const createTempUser = async () => {
  const res = await axios.post(`${USER_API}/users`, {
    email: `guest-${Date.now()}@example.com`,
    name: 'Guest User'
  })
  
  const user = res.data?.data || res.data
  setUserId(user.id)
  localStorage.setItem('userId', user.id)
}
```

**Flow:**
```
1. Frontend → User Service (HTTP POST /users)
   Request: { email: "guest-123@example.com", name: "Guest User" }
   ↓
2. User Service: Creates user in MongoDB
   ↓
3. User Service → Kafka (publishes user.created)
   ↓
4. Notification Service ← Kafka (consumes user.created)
   → Sends welcome email
   ↓
5. User Service → Frontend (HTTP 201)
   Response: { service: "user-service", data: {...user} }
   ↓
6. Frontend: Saves userId to localStorage
```

### Step 3: Place Order

**User Action**: Fill shipping form and click "Place Order"

```typescript
const handlePlaceOrder = async () => {
  if (!userId) {
    setError('Please login or create an account')
    return
  }
  
  setLoading(true)
  setError(null)
  
  try {
    // Convert cart items to order items
    const items = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }))
    
    // Create order
    const res = await axios.post(`${ORDER_API}/orders`, {
      userId: userId,
      items: items
    }, {
      timeout: 30000  // 30 second timeout
    })
    
    const order = res.data?.data || res.data
    
    // Clear cart
    localStorage.removeItem('cart')
    
    // Navigate to confirmation
    navigate(`/order-confirmation/${order.id}`)
  } catch (err) {
    setError(err.response?.data?.error || err.message)
  } finally {
    setLoading(false)
  }
}
```

### Complete Order Creation Flow

```
1. Frontend → Order Service (HTTP POST /orders)
   Request: {
     userId: "uuid",
     items: [
       { productId: "prod-1", quantity: 2, price: 29.99 }
     ]
   }
   ↓
2. Order Service: Validates input, calculates total
   ↓
3. Order Service → Inventory Service (gRPC CheckStock)
   Request: { productId: "prod-1", quantity: 2 }
   Response: { inStock: true, availableQuantity: 50 }
   ↓
4. Order Service → Inventory Service (gRPC ReserveInventory)
   Request: { orderId: "temp", productId: "prod-1", quantity: 2 }
   Response: { reservationId: "uuid", success: true }
   ↓
5. Inventory Service: Creates reservation, updates quantities
   ↓
6. Inventory Service → Kafka (publishes inventory.updated)
   ↓
7. Order Service → Payment Service (gRPC ProcessPayment)
   Request: {
     orderId: "uuid",
     userId: "uuid",
     amount: 59.98,
     currency: "USD"
   }
   Response: { paymentId: "uuid", status: "COMPLETED" }
   ↓
8. Payment Service: Creates payment record
   ↓
9. Payment Service → Kafka (publishes payment.processed)
   ↓
10. Order Service: Creates order record
   ↓
11. Order Service → Kafka (publishes order.created)
   ↓
12. Inventory Service ← Kafka (consumes order.created)
    → Logs event
   ↓
13. Payment Service ← Kafka (consumes order.created)
    → Logs event
   ↓
14. Notification Service ← Kafka (consumes order.created)
    → Creates notification, sends order confirmation email
   ↓
15. Order Service ← Kafka (consumes payment.processed)
    → Updates order status
   ↓
16. Notification Service ← Kafka (consumes payment.processed)
    → Sends payment confirmation email
   ↓
17. Order Service → Frontend (HTTP 201)
   Response: {
     service: "order-service",
     data: {
       id: "uuid",
       userId: "uuid",
       items: [...],
       totalAmount: 59.98,
       status: "CONFIRMED",
       paymentId: "uuid"
     }
   }
   ↓
18. Frontend: Clears cart, navigates to confirmation page
```

---

## Order Flow

### User Action: View Orders

**Frontend Code**: `frontend/src/pages/Orders.tsx`

```typescript
const fetchOrders = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  const res = await axios.get(`${ORDER_API}/orders?userId=${userId}`)
  setOrders(res.data?.data || res.data || [])
}
```

**Flow:**
```
1. Frontend → Order Service (HTTP GET /orders?userId=uuid)
   ↓
2. Order Service: Queries orders from memory/database
   ↓
3. Order Service → Frontend (HTTP 200)
   Response: { service: "order-service", data: [...orders] }
   ↓
4. Frontend: Renders orders list
```

### User Action: View Order Details

```typescript
const fetchOrder = async (orderId: string) => {
  const res = await axios.get(`${ORDER_API}/orders/${orderId}`)
  setOrder(res.data?.data || res.data)
}
```

**Flow:**
```
1. Frontend → Order Service (HTTP GET /orders/:id)
   ↓
2. Order Service: Queries order from memory/database
   ↓
3. Order Service → Frontend (HTTP 200)
   Response: { service: "order-service", data: {...order} }
   ↓
4. Frontend: Renders order details
```

### User Action: Cancel Order

```typescript
const cancelOrder = async (orderId: string) => {
  await axios.delete(`${ORDER_API}/orders/${orderId}`)
  fetchOrders()  // Refresh list
}
```

**Complete Cancellation Flow:**
```
1. Frontend → Order Service (HTTP DELETE /orders/:id)
   ↓
2. Order Service: Finds order, updates status to CANCELLED
   ↓
3. Order Service → Inventory Service (gRPC ReleaseInventory)
   Request: { reservationId: "uuid", orderId: "uuid" }
   Response: { success: true }
   ↓
4. Inventory Service: Finds reservation, releases inventory
   ↓
5. Inventory Service: Updates product quantities
   ↓
6. Inventory Service → Kafka (publishes inventory.updated)
   ↓
7. Order Service → Kafka (publishes order.cancelled)
   ↓
8. Inventory Service ← Kafka (consumes order.cancelled)
    → Releases any remaining reservations
   ↓
9. Notification Service ← Kafka (consumes order.cancelled)
    → Sends cancellation email
   ↓
10. Order Service → Frontend (HTTP 200)
   Response: { service: "order-service", data: {...order} }
   ↓
11. Frontend: Refreshes orders list
```

---

## User Management Flow

### User Action: Create Account

**Frontend Code**: `frontend/src/pages/UserServicePage.tsx`

```typescript
const createUser = async () => {
  const res = await axios.post(`${API_BASE}/users`, {
    email: formData.email,
    name: formData.name,
    password: formData.password
  })
  setResponse(res.data)
  fetchUsers()
}
```

**Flow:**
```
1. Frontend → User Service (HTTP POST /users)
   Request: { email: "user@example.com", name: "John", password: "pass" }
   ↓
2. User Service: Validates input, hashes password
   ↓
3. User Service: Creates user in MongoDB
   ↓
4. User Service → Kafka (publishes user.created)
   ↓
5. Order Service ← Kafka (consumes user.created)
    → Logs event (can initialize user order history)
   ↓
6. Notification Service ← Kafka (consumes user.created)
    → Creates notification, sends welcome email
   ↓
7. User Service → Frontend (HTTP 201)
   Response: { service: "user-service", data: {...user} }
   ↓
8. Frontend: Updates UI, shows success message
```

### User Action: Update Profile

```typescript
const updateUser = async (id: string, payload: { name?: string; email?: string }) => {
  const res = await axios.put(`${API_BASE}/users/${id}`, payload)
  setResponse(res.data)
  fetchUsers()
}
```

**Flow:**
```
1. Frontend → User Service (HTTP PUT /users/:id)
   Request: { name: "Jane Doe" }
   ↓
2. User Service: Updates user in MongoDB
   ↓
3. User Service → Kafka (publishes user.updated)
   ↓
4. Order Service ← Kafka (consumes user.updated)
    → Logs event (can update order history)
   ↓
5. User Service → Frontend (HTTP 200)
   Response: { service: "user-service", data: {...updatedUser} }
   ↓
6. Frontend: Updates UI
```

---

## Complete User Journey

### Scenario: User Buys a Product

```
1. USER OPENS HOME PAGE
   Frontend → Inventory Service (GET /products)
   Response: List of products
   Frontend: Displays products
   
2. USER CLICKS PRODUCT
   Frontend → Inventory Service (GET /products/:id)
   Response: Product details
   Frontend: Displays product page
   
3. USER ADDS TO CART
   Frontend: Saves to localStorage
   (No backend call)
   
4. USER GOES TO CART
   Frontend: Reads from localStorage
   (No backend call)
   
5. USER CLICKS CHECKOUT
   Frontend: If no userId, creates guest user
   Frontend → User Service (POST /users)
   User Service → Kafka (user.created)
   Notification Service ← Kafka → Sends welcome email
   
6. USER PLACES ORDER
   Frontend → Order Service (POST /orders)
   Order Service → Inventory Service (gRPC CheckStock)
   Order Service → Inventory Service (gRPC ReserveInventory)
   Inventory Service → Kafka (inventory.updated)
   Order Service → Payment Service (gRPC ProcessPayment)
   Payment Service → Kafka (payment.processed)
   Order Service → Kafka (order.created)
   Notification Service ← Kafka → Sends order confirmation
   Notification Service ← Kafka → Sends payment confirmation
   Order Service → Frontend (Order created)
   Frontend: Clears cart, shows confirmation
   
7. USER VIEWS ORDERS
   Frontend → Order Service (GET /orders?userId=uuid)
   Response: List of orders
   Frontend: Displays orders
   
8. USER CANCELS ORDER (if needed)
   Frontend → Order Service (DELETE /orders/:id)
   Order Service → Inventory Service (gRPC ReleaseInventory)
   Inventory Service → Kafka (inventory.updated)
   Order Service → Kafka (order.cancelled)
   Notification Service ← Kafka → Sends cancellation email
   Order Service → Frontend (Order cancelled)
   Frontend: Updates UI
```

---

## Summary

### Frontend Actions → Backend Operations

| Frontend Action | HTTP Call | gRPC Calls | Kafka Events |
|----------------|-----------|------------|--------------|
| **Load Home** | GET /products | - | - |
| **View Product** | GET /products/:id | - | - |
| **Add to Cart** | - | - | - |
| **Checkout** | POST /users (if needed) | - | user.created |
| **Place Order** | POST /orders | CheckStock, ReserveInventory, ProcessPayment | order.created, payment.processed, inventory.updated |
| **View Orders** | GET /orders | - | - |
| **Cancel Order** | DELETE /orders/:id | ReleaseInventory | order.cancelled, inventory.updated |
| **Create User** | POST /users | - | user.created |
| **Update User** | PUT /users/:id | - | user.updated |

### Key Points

1. **Cart is Client-Side**: All cart operations use localStorage (no backend)
2. **Order Creation is Complex**: Involves multiple gRPC calls and Kafka events
3. **User Creation Triggers Events**: Creates user, publishes event, sends email
4. **Order Cancellation Releases Inventory**: gRPC call + Kafka events
5. **Notifications are Event-Driven**: Notification Service reacts to all events

**Next Steps:**
- Read [SERVICE_DOCUMENTATION.md](./SERVICE_DOCUMENTATION.md) for detailed service information
- Read [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for architecture details


import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Orders.css'

const ORDER_API = 'http://localhost:5002'

interface Order {
  id: string
  userId: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: string
  createdAt: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (userId) {
      fetchOrders()
    } else {
      setError('Please login to view your orders')
      setLoading(false)
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${ORDER_API}/orders`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const allOrders = res.data?.data || res.data || []
      
      if (!Array.isArray(allOrders)) {
        console.error('Invalid orders data format:', allOrders)
        setError('Invalid response format from server')
        return
      }
      
      // Filter by userId and sort by date, newest first
      const userOrders = allOrders
        .filter((order: Order) => order.userId === userId)
        .sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      
      setOrders(userOrders)
      console.log(`✅ Loaded ${userOrders.length} orders for user ${userId}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load orders'
      setError(errorMessage)
      console.error('Error fetching orders:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '#856404'
      case 'CONFIRMED':
        return '#0c5460'
      case 'PROCESSING':
        return '#155724'
      case 'COMPLETED':
        return '#155724'
      case 'CANCELLED':
        return '#721c24'
      default:
        return '#666'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '#fff3cd'
      case 'CONFIRMED':
        return '#d1ecf1'
      case 'PROCESSING':
        return '#d4edda'
      case 'COMPLETED':
        return '#d4edda'
      case 'CANCELLED':
        return '#f8d7da'
      default:
        return '#e0e0e0'
    }
  }

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <Link to="/" className="continue-shopping-link">
          Continue Shopping
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!userId && (
        <div className="no-user-message">
          <p>Please login to view your orders</p>
          <Link to="/" className="continue-shopping-link">
            Go to Home
          </Link>
        </div>
      )}

      {orders.length === 0 && userId && !error ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="continue-shopping-btn">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.substring(0, 8)}</h3>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusBg(order.status),
                    color: getStatusColor(order.status)
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-details">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">${order.totalAmount.toFixed(2)}</span>
                </div>
                <Link to={`/order/${order.id}`} className="view-order-btn">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders


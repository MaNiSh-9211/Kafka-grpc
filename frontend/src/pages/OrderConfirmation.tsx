import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './OrderConfirmation.css'

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

function OrderConfirmation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState<Order | null>(location.state?.order || null)
  const [loading, setLoading] = useState(!order)

  useEffect(() => {
    if (!order && id) {
      fetchOrder(id)
    }
  }, [id, order])

  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true)
      const res = await axios.get(`${ORDER_API}/orders/${orderId}`)
      setOrder(res.data.data || res.data)
    } catch (err: any) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading">Loading order...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-message">Order not found</div>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-content">
        <div className="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="confirmation-message">
          Thank you for your order. Your order has been received and is being processed.
        </p>

        <div className="order-details">
          <div className="detail-section">
            <h2>Order Information</h2>
            <div className="detail-row">
              <span>Order ID:</span>
              <span className="order-id">{order.id}</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className={`status-badge status-${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="detail-row">
              <span>Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span>Total Amount:</span>
              <span className="total-amount">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="detail-section">
              <h2>Shipping Address</h2>
              <div className="address-block">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h2>Order Items</h2>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="order-item-row">
                  <div className="item-info">
                    <span className="item-name">{item.productName}</span>
                    <span className="item-qty">Quantity: {item.quantity}</span>
                  </div>
                  <span className="item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/orders')} className="view-orders-btn">
            View All Orders
          </button>
          <button onClick={() => navigate('/')} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation


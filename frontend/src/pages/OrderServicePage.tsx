import { useState } from 'react'
import axios from 'axios'
import EventLog from '../components/EventLog'
import '../App.css'

const API_BASE = 'http://localhost:5002'

interface Order {
  id: string
  userId: string
  items: Array<{ productId: string; quantity: number; price: number }>
  totalAmount: number
  status: string
  createdAt: string
}

function OrderServicePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    items: [{ productId: 'prod-1', quantity: 1, price: 29.99 }]
  })

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/orders`)
      setOrders(res.data.data || res.data)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (payload?: any) => {
    setLoading(true)
    setError(null)
    const data = payload || formData
    try {
      const res = await axios.post(`${API_BASE}/orders`, data)
      setResponse(res.data)
      if (!payload) {
        setFormData({ userId: '', items: [{ productId: 'prod-1', quantity: 1, price: 29.99 }] })
      }
      fetchOrders()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getOrder = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/orders/${id}`)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.put(`${API_BASE}/orders/${id}/status`, { status })
      setResponse(res.data)
      fetchOrders()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h1 className="card-title">
          🛒 Order Service
          <span className="info-badge badge-producer">PRODUCER</span>
          <span className="info-badge badge-consumer">CONSUMER</span>
          <span className="info-badge badge-grpc">gRPC CLIENT</span>
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Service Role</h3>
            <p><strong>Producer + Consumer + gRPC Client</strong></p>
            <p>Orchestrates order creation using gRPC calls</p>
          </div>
          <div className="info-card">
            <h3>Kafka Topics</h3>
            <p><strong>Produces:</strong> <code>order.created</code>, <code>order.status.updated</code></p>
            <p><strong>Consumes:</strong> <code>user.created</code>, <code>inventory.updated</code>, <code>payment.processed</code></p>
          </div>
          <div className="info-card">
            <h3>gRPC Calls</h3>
            <p><strong>Calls Payment Service:</strong> ProcessPayment</p>
            <p><strong>Calls Inventory Service:</strong> CheckStock, ReserveInventory</p>
          </div>
          <div className="info-card">
            <h3>Port</h3>
            <p>HTTP API: <code>5002</code></p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">Available APIs</h2>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/orders</div>
            <div className="api-description">Get all orders</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">No (Read operation)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="button" onClick={fetchOrders} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchOrders} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-post">POST</span>
            <div className="api-path">/orders</div>
            <div className="api-description">Create a new order (orchestrates Payment & Inventory via gRPC)</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>order.created</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No (but consumes events from other services)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Client:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - Calls Payment Service (ProcessPayment) and Inventory Service (CheckStock, ReserveInventory)
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Flow:</span>
                <span className="detail-value">
                  1. Check inventory (gRPC) → 2. Reserve inventory (gRPC) → 3. Process payment (gRPC) → 4. Create order → 5. Publish event
                </span>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">User ID:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="user-123"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product ID:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.items[0].productId}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...formData.items[0], productId: e.target.value }]
                  })}
                  placeholder="prod-1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity:</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.items[0].quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...formData.items[0], quantity: parseInt(e.target.value) || 1 }]
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price:</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.items[0].price}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...formData.items[0], price: parseFloat(e.target.value) || 0 }]
                  })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => createOrder()} disabled={loading}>
                  Create Order (with gRPC calls)
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => createOrder({ 
                    userId: 'user-123', 
                    items: [{ productId: 'prod-1', quantity: 2, price: 29.99 }] 
                  })} 
                  disabled={loading}
                  title="Test with default payload"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/orders/:id</div>
            <div className="api-description">Get order by ID</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">No (Read operation)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <input
                type="text"
                id="get-order-id"
                className="form-input"
                placeholder="Order ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getOrder((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-order-id') as HTMLInputElement
                  if (input?.value) getOrder(input.value)
                }}>
                  Get Order
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (orders.length > 0) {
                      getOrder(orders[0].id)
                    } else {
                      setError('No orders available. Create an order first.')
                    }
                  }}
                  disabled={orders.length === 0}
                  title="Test with first available order ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-put">PUT</span>
            <div className="api-path">/orders/:id/status</div>
            <div className="api-description">Update order status</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>order.status.updated</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <input
                type="text"
                id="update-order-id"
                className="form-input"
                placeholder="Order ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
              />
              <select
                id="order-status"
                className="form-input"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
              >
                <option value="PROCESSING">PROCESSING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="button" 
                  onClick={() => {
                    const input = document.getElementById('update-order-id') as HTMLInputElement
                    const select = document.getElementById('order-status') as HTMLSelectElement
                    if (input?.value && select?.value) {
                      updateOrderStatus(input.value, select.value)
                    }
                  }}
                >
                  Update Status
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (orders.length > 0) {
                      updateOrderStatus(orders[0].id, 'PROCESSING')
                    } else {
                      setError('No orders available. Create an order first.')
                    }
                  }}
                  disabled={orders.length === 0}
                  title="Test with first available order ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">Kafka Consumer Events</h2>
          <div className="api-item">
            <div className="api-description">
              <strong>Consumes from Kafka:</strong>
            </div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Topic: user.created</span>
                <span className="detail-value">Updates local user cache when new user is created</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: inventory.updated</span>
                <span className="detail-value">Updates inventory information</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: payment.processed</span>
                <span className="detail-value">Updates order status when payment is processed</span>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-box">Error: {error}</div>}
        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
              Response from <span style={{ color: '#667eea' }}>{response.service || 'order-service'}</span>:
            </div>
            <div className="response-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
        {orders.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Orders ({orders.length}):</h3>
            <div style={{ marginTop: '1rem' }}>
              {orders.map((order) => (
                <div key={order.id} className="api-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>Order {order.id}</strong> - User: {order.userId} - Status: {order.status} - Total: ${order.totalAmount}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventLog apiBase={API_BASE} serviceName="Order Service" />
    </div>
  )
}

export default OrderServicePage


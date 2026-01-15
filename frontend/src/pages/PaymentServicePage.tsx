import { useState } from 'react'
import axios from 'axios'
import EventLog from '../components/EventLog'
import '../App.css'

const API_BASE = 'http://localhost:5003'

interface Payment {
  id: string
  orderId: string
  userId: string
  amount: number
  status: string
  createdAt: string
}

function PaymentServicePage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/payments`)
      setPayments(res.data.data || res.data)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getPayment = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/payments/${id}`)
      setResponse(res.data)
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
          💳 Payment Service
          <span className="info-badge badge-producer">PRODUCER</span>
          <span className="info-badge badge-consumer">CONSUMER</span>
          <span className="info-badge badge-grpc">gRPC SERVER</span>
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Service Role</h3>
            <p><strong>Producer + Consumer + gRPC Server</strong></p>
            <p>Exposes gRPC endpoints for payment processing</p>
          </div>
          <div className="info-card">
            <h3>Kafka Topics</h3>
            <p><strong>Produces:</strong> <code>payment.processed</code>, <code>payment.failed</code>, <code>payment.refunded</code></p>
            <p><strong>Consumes:</strong> <code>order.created</code> (optional)</p>
          </div>
          <div className="info-card">
            <h3>gRPC Server</h3>
            <p><strong>Exposes:</strong> ProcessPayment, RefundPayment, GetPaymentStatus</p>
            <p><strong>Called by:</strong> Order Service (gRPC Client)</p>
          </div>
          <div className="info-card">
            <h3>Port</h3>
            <p>HTTP API: <code>5003</code></p>
            <p>gRPC Server: <code>5003</code></p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">HTTP REST APIs</h2>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/payments</div>
            <div className="api-description">Get all payments</div>
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
              <button className="button" onClick={fetchPayments} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchPayments} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/payments/:id</div>
            <div className="api-description">Get payment by ID</div>
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
                id="get-payment-id"
                className="form-input"
                placeholder="Payment ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getPayment((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-payment-id') as HTMLInputElement
                  if (input?.value) getPayment(input.value)
                }}>
                  Get Payment
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (payments.length > 0) {
                      getPayment(payments[0].id)
                    } else {
                      setError('No payments available. Create an order first to generate payments.')
                    }
                  }}
                  disabled={payments.length === 0}
                  title="Test with first available payment ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">gRPC Server Endpoints</h2>
          
          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">ProcessPayment(orderId, userId, amount, currency)</div>
            <div className="api-description">Process a payment (called by Order Service via gRPC)</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>payment.processed</code> or <code>payment.failed</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Payment Service
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Called by:</span>
                <span className="detail-value">Order Service (gRPC Client)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Flow:</span>
                <span className="detail-value">
                  Order Service → (gRPC call) → Payment Service → Process Payment → Publish event to Kafka
                </span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">RefundPayment(paymentId, amount)</div>
            <div className="api-description">Refund a payment (called by Order Service via gRPC)</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>payment.refunded</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Payment Service
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Called by:</span>
                <span className="detail-value">Order Service (gRPC Client)</span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">GetPaymentStatus(paymentId)</div>
            <div className="api-description">Get payment status (called by Order Service via gRPC)</div>
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
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Payment Service
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Called by:</span>
                <span className="detail-value">Order Service (gRPC Client)</span>
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
                <span className="detail-label">Topic: order.created</span>
                <span className="detail-value">Optional - Can react to order creation events</span>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-box">Error: {error}</div>}
        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
              Response from <span style={{ color: '#667eea' }}>{response.service || 'payment-service'}</span>:
            </div>
            <div className="response-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
        {payments.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Payments ({payments.length}):</h3>
            <div style={{ marginTop: '1rem' }}>
              {payments.map((payment) => (
                <div key={payment.id} className="api-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>Payment {payment.id}</strong> - Order: {payment.orderId} - Amount: ${payment.amount} - Status: {payment.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventLog apiBase={API_BASE} serviceName="Payment Service" />
    </div>
  )
}

export default PaymentServicePage


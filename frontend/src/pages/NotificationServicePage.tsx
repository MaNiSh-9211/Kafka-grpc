import { useState } from 'react'
import axios from 'axios'
import EventLog from '../components/EventLog'
import '../App.css'

const API_BASE = 'http://localhost:5005'

interface Notification {
  id: string
  userId: string
  type: string
  message: string
  status: string
  createdAt: string
}

function NotificationServicePage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/notifications`)
      setNotifications(res.data.data || res.data)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getNotification = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/notifications/${id}`)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getUserNotifications = async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/notifications/user/${userId}`)
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
          🔔 Notification Service
          <span className="info-badge badge-consumer">CONSUMER</span>
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Service Role</h3>
            <p><strong>Consumer Only</strong> - Consumes events from all services</p>
            <p>Sends notifications based on events</p>
          </div>
          <div className="info-card">
            <h3>Kafka Topics</h3>
            <p><strong>Consumes:</strong> All event topics from all services</p>
            <p><code>user.created</code>, <code>order.created</code>, <code>payment.processed</code>, <code>inventory.updated</code>, etc.</p>
          </div>
          <div className="info-card">
            <h3>gRPC</h3>
            <p>No gRPC (Consumer only service)</p>
          </div>
          <div className="info-card">
            <h3>Port</h3>
            <p>HTTP API: <code>5005</code></p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">HTTP REST APIs</h2>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/notifications</div>
            <div className="api-description">Get all notifications</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">No (Read operation)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No (but consumes events from Kafka)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="button" onClick={fetchNotifications} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchNotifications} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/notifications/:id</div>
            <div className="api-description">Get notification by ID</div>
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
                id="get-notification-id"
                className="form-input"
                placeholder="Notification ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getNotification((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-notification-id') as HTMLInputElement
                  if (input?.value) getNotification(input.value)
                }}>
                  Get Notification
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (notifications.length > 0) {
                      getNotification(notifications[0].id)
                    } else {
                      setError('No notifications available. Create events to generate notifications.')
                    }
                  }}
                  disabled={notifications.length === 0}
                  title="Test with first available notification ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/notifications/user/:userId</div>
            <div className="api-description">Get notifications for a specific user</div>
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
                id="get-user-notifications"
                className="form-input"
                placeholder="User ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getUserNotifications((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-user-notifications') as HTMLInputElement
                  if (input?.value) getUserNotifications(input.value)
                }}>
                  Get User Notifications
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => getUserNotifications('user-123')}
                  title="Test with default user ID"
                >
                  Test with Default (user-123)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">Kafka Consumer Events</h2>
          
          <div className="api-item">
            <div className="api-description">
              <strong>Consumes from Kafka (All Topics):</strong>
            </div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Topic: user.created</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends welcome email
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: order.created</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends order confirmation
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: order.status.updated</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends status update
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: payment.processed</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends payment confirmation
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: payment.failed</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends payment failure notification
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: inventory.updated</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Can send inventory alerts
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Topic: inventory.low</span>
                <span className="detail-value">
                  <strong>Consumer:</strong> Notification Service → Sends low stock alert
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">Event Flow Example</h2>
          <div className="api-item">
            <div className="api-description">
              <strong>Example: User creates an order</strong>
            </div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">1. Order Created</span>
                <span className="detail-value">
                  Order Service publishes <code>order.created</code> event
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">2. Notification Sent</span>
                <span className="detail-value">
                  Notification Service consumes <code>order.created</code> → Sends order confirmation email
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">3. Payment Processed</span>
                <span className="detail-value">
                  Payment Service publishes <code>payment.processed</code> event
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">4. Payment Notification</span>
                <span className="detail-value">
                  Notification Service consumes <code>payment.processed</code> → Sends payment confirmation
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-box">Error: {error}</div>}
        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
              Response from <span style={{ color: '#667eea' }}>{response.service || 'notification-service'}</span>:
            </div>
            <div className="response-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
        {notifications.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Notifications ({notifications.length}):</h3>
            <div style={{ marginTop: '1rem' }}>
              {notifications.map((notification) => (
                <div key={notification.id} className="api-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>{notification.type}</strong> - User: {notification.userId} - Status: {notification.status} - {notification.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventLog apiBase={API_BASE} serviceName="Notification Service" />
    </div>
  )
}

export default NotificationServicePage


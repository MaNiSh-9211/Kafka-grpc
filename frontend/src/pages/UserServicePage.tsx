import { useState } from 'react'
import axios from 'axios'
import EventLog from '../components/EventLog'
import '../App.css'

const API_BASE = 'http://localhost:5001'

interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

function UserServicePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', name: '' })

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/users`)
      setUsers(res.data.data || res.data)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (payload?: { email: string; name: string }) => {
    setLoading(true)
    setError(null)
    const data = payload || formData
    try {
      const res = await axios.post(`${API_BASE}/users`, data)
      setResponse(res.data)
      if (!payload) {
        setFormData({ email: '', name: '' })
        fetchUsers()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getUser = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/users/${id}`)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, payload: { name?: string; email?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.put(`${API_BASE}/users/${id}`, payload)
      setResponse(res.data)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.delete(`${API_BASE}/users/${id}`)
      setResponse({ service: 'user-service', message: 'User deleted successfully', status: res.status })
      fetchUsers()
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
          👤 User Service
          <span className="info-badge badge-producer">PRODUCER</span>
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Service Role</h3>
            <p><strong>Producer Only</strong> - Publishes user events to Kafka</p>
          </div>
          <div className="info-card">
            <h3>Kafka Topics</h3>
            <p>Publishes to: <code>user.created</code>, <code>user.updated</code>, <code>user.deleted</code></p>
          </div>
          <div className="info-card">
            <h3>Port</h3>
            <p>HTTP API: <code>5001</code></p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">Available APIs</h2>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/users</div>
            <div className="api-description">Get all users</div>
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
              <button className="button" onClick={fetchUsers} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchUsers} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-post">POST</span>
            <div className="api-path">/users</div>
            <div className="api-description">Create a new user</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>user.created</code> event</span>
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
              <div className="form-group">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => createUser()} disabled={loading}>
                  Create User
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => createUser({ email: 'test@example.com', name: 'Test User' })} 
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
            <div className="api-path">/users/:id</div>
            <div className="api-description">Get user by ID</div>
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
                id="get-user-id"
                className="form-input"
                placeholder="User ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getUser((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-user-id') as HTMLInputElement
                  if (input?.value) getUser(input.value)
                }}>
                  Get User
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    // Get first user ID if available
                    if (users.length > 0) {
                      getUser(users[0].id)
                    } else {
                      setError('No users available. Create a user first.')
                    }
                  }}
                  disabled={users.length === 0}
                  title="Test with first available user ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-put">PUT</span>
            <div className="api-path">/users/:id</div>
            <div className="api-description">Update user</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>user.updated</code> event</span>
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
                id="update-user-id"
                className="form-input"
                placeholder="User ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="button" 
                  onClick={() => {
                    const input = document.getElementById('update-user-id') as HTMLInputElement
                    if (input?.value && users.length > 0) {
                      const user = users.find(u => u.id === input.value)
                      if (user) {
                        updateUser(input.value, { name: 'Updated Name', email: user.email })
                      } else {
                        setError('User not found')
                      }
                    }
                  }}
                >
                  Update User
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (users.length > 0) {
                      updateUser(users[0].id, { name: 'Updated Name' })
                    } else {
                      setError('No users available. Create a user first.')
                    }
                  }}
                  disabled={users.length === 0}
                  title="Test with first available user ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-delete">DELETE</span>
            <div className="api-path">/users/:id</div>
            <div className="api-description">Delete user</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>user.deleted</code> event</span>
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
                id="delete-user-id"
                className="form-input"
                placeholder="User ID"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="button" 
                  onClick={() => {
                    const input = document.getElementById('delete-user-id') as HTMLInputElement
                    if (input?.value) {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        deleteUser(input.value)
                      }
                    }
                  }}
                >
                  Delete User
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => {
                    if (users.length > 0) {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        deleteUser(users[0].id)
                      }
                    } else {
                      setError('No users available. Create a user first.')
                    }
                  }}
                  disabled={users.length === 0}
                  title="Test with first available user ID"
                >
                  Test with Default
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-box">Error: {error}</div>}
        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
              Response from <span style={{ color: '#667eea' }}>{response.service || 'user-service'}</span>:
            </div>
            <div className="response-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
        {users.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Users ({users.length}):</h3>
            <div style={{ marginTop: '1rem' }}>
              {users.map((user) => (
                <div key={user.id} className="api-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>{user.name}</strong> ({user.email}) - ID: {user.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventLog apiBase={API_BASE} serviceName="User Service" />
    </div>
  )
}

export default UserServicePage


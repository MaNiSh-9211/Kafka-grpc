import { useState } from 'react'
import axios from 'axios'
import EventLog from '../components/EventLog'
import '../App.css'

const API_BASE = 'http://localhost:5004'

interface Product {
  id: string
  name: string
  totalQuantity: number
  availableQuantity: number
}

function InventoryServicePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/products`)
      setProducts(res.data.data || res.data)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const getProduct = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/products/${id}`)
      setResponse(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/reservations`)
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
          📦 Inventory Service
          <span className="info-badge badge-producer">PRODUCER</span>
          <span className="info-badge badge-consumer">CONSUMER</span>
          <span className="info-badge badge-grpc">gRPC SERVER</span>
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Service Role</h3>
            <p><strong>Producer + Consumer + gRPC Server</strong></p>
            <p>Exposes gRPC endpoints for inventory operations</p>
          </div>
          <div className="info-card">
            <h3>Kafka Topics</h3>
            <p><strong>Produces:</strong> <code>inventory.updated</code>, <code>inventory.low</code></p>
            <p><strong>Consumes:</strong> <code>order.created</code></p>
          </div>
          <div className="info-card">
            <h3>gRPC Server</h3>
            <p><strong>Exposes:</strong> CheckStock, ReserveInventory, ReleaseInventory</p>
            <p><strong>Called by:</strong> Order Service (gRPC Client)</p>
          </div>
          <div className="info-card">
            <h3>Port</h3>
            <p>HTTP API: <code>5004</code></p>
            <p>gRPC Server: <code>5004</code></p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">HTTP REST APIs</h2>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/products</div>
            <div className="api-description">Get all products</div>
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
              <button className="button" onClick={fetchProducts} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchProducts} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/products/:id</div>
            <div className="api-description">Get product by ID</div>
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
                id="get-product-id"
                className="form-input"
                placeholder="Product ID (e.g., prod-1)"
                style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getProduct((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="button" onClick={() => {
                  const input = document.getElementById('get-product-id') as HTMLInputElement
                  if (input?.value) getProduct(input.value)
                }}>
                  Get Product
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={() => getProduct('prod-1')}
                  title="Test with default product ID"
                >
                  Test with Default (prod-1)
                </button>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method method-get">GET</span>
            <div className="api-path">/reservations</div>
            <div className="api-description">Get all inventory reservations</div>
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
              <button className="button" onClick={fetchReservations} disabled={loading}>
                Test API
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchReservations} 
                disabled={loading}
                title="Test with default: No payload needed"
              >
                Test with Default
              </button>
            </div>
          </div>
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">gRPC Server Endpoints</h2>
          
          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">CheckStock(productId, quantity)</div>
            <div className="api-description">Check if product is in stock (called by Order Service via gRPC)</div>
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
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Inventory Service
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Called by:</span>
                <span className="detail-value">Order Service (gRPC Client)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Flow:</span>
                <span className="detail-value">
                  Order Service → (gRPC call) → Inventory Service → Check Stock → Return availability
                </span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">ReserveInventory(orderId, productId, quantity)</div>
            <div className="api-description">Reserve inventory for an order (called by Order Service via gRPC)</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>inventory.updated</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Inventory Service
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Called by:</span>
                <span className="detail-value">Order Service (gRPC Client)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Flow:</span>
                <span className="detail-value">
                  Order Service → (gRPC call) → Inventory Service → Reserve Stock → Publish event to Kafka
                </span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <span className="api-method badge-grpc">gRPC</span>
            <div className="api-path">ReleaseInventory(reservationId)</div>
            <div className="api-description">Release reserved inventory (called by Order Service via gRPC)</div>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Producer:</span>
                <span className="detail-value">Yes - Publishes <code>inventory.updated</code> event</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumer:</span>
                <span className="detail-value">No</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">
                  <strong>Yes</strong> - This is a gRPC endpoint exposed by Inventory Service
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
                <span className="detail-value">Updates inventory when order is created</span>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-box">Error: {error}</div>}
        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
              Response from <span style={{ color: '#667eea' }}>{response.service || 'inventory-service'}</span>:
            </div>
            <div className="response-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
        {products.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Products ({products.length}):</h3>
            <div style={{ marginTop: '1rem' }}>
              {products.map((product) => (
                <div key={product.id} className="api-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>{product.name}</strong> (ID: {product.id}) - Available: {product.availableQuantity} / Total: {product.totalQuantity}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventLog apiBase={API_BASE} serviceName="Inventory Service" />
    </div>
  )
}

export default InventoryServicePage


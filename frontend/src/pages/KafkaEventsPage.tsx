import '../App.css'

function KafkaEventsPage() {
  const topics = [
    {
      name: 'user.created',
      producer: 'User Service',
      consumers: ['Order Service', 'Notification Service'],
      description: 'Published when a new user is created'
    },
    {
      name: 'user.updated',
      producer: 'User Service',
      consumers: ['Order Service'],
      description: 'Published when a user is updated'
    },
    {
      name: 'user.deleted',
      producer: 'User Service',
      consumers: ['Order Service'],
      description: 'Published when a user is deleted'
    },
    {
      name: 'order.created',
      producer: 'Order Service',
      consumers: ['Inventory Service', 'Notification Service'],
      description: 'Published when a new order is created'
    },
    {
      name: 'order.status.updated',
      producer: 'Order Service',
      consumers: ['Notification Service'],
      description: 'Published when order status changes'
    },
    {
      name: 'payment.processed',
      producer: 'Payment Service',
      consumers: ['Order Service', 'Notification Service'],
      description: 'Published when payment is successfully processed'
    },
    {
      name: 'payment.failed',
      producer: 'Payment Service',
      consumers: ['Order Service', 'Notification Service'],
      description: 'Published when payment processing fails'
    },
    {
      name: 'payment.refunded',
      producer: 'Payment Service',
      consumers: ['Order Service', 'Notification Service'],
      description: 'Published when a payment is refunded'
    },
    {
      name: 'inventory.updated',
      producer: 'Inventory Service',
      consumers: ['Order Service', 'Notification Service'],
      description: 'Published when inventory levels change'
    },
    {
      name: 'inventory.low',
      producer: 'Inventory Service',
      consumers: ['Notification Service'],
      description: 'Published when inventory falls below threshold'
    }
  ]

  return (
    <div>
      <div className="card">
        <h1 className="card-title">
          📨 Kafka Events Dashboard
        </h1>
        
        <div className="service-info">
          <div className="info-card">
            <h3>Kafka Infrastructure</h3>
            <p><strong>Shared Cluster</strong> - All services connect to the same Kafka broker</p>
            <p>Broker: <code>localhost:9092</code></p>
          </div>
          <div className="info-card">
            <h3>Total Topics</h3>
            <p><strong>{topics.length} Topics</strong></p>
            <p>All topics are auto-created when first message is published</p>
          </div>
          <div className="info-card">
            <h3>Communication Pattern</h3>
            <p><strong>Event-Driven Architecture</strong></p>
            <p>Services communicate asynchronously via Kafka events</p>
          </div>
        </div>

        <div className="api-section">
          <h2 className="card-subtitle">All Kafka Topics</h2>
          
          {topics.map((topic) => (
            <div key={topic.name} className="api-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="api-method" style={{ background: '#667eea', color: 'white' }}>TOPIC</span>
                <div className="api-path" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                  {topic.name}
                </div>
              </div>
              <div className="api-description">{topic.description}</div>
              <div className="api-details">
                <div className="detail-row">
                  <span className="detail-label">Producer:</span>
                  <span className="detail-value">
                    <span className="info-badge badge-producer">{topic.producer}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Consumers:</span>
                  <span className="detail-value">
                    {topic.consumers.map((consumer) => (
                      <span key={consumer} className="info-badge badge-consumer" style={{ marginRight: '0.5rem' }}>
                        {consumer}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="api-section" style={{ marginTop: '2rem' }}>
          <h2 className="card-subtitle">Service Communication Summary</h2>
          
          <div className="api-item">
            <h3 style={{ marginBottom: '1rem' }}>User Service</h3>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">Producer Only</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Publishes:</span>
                <span className="detail-value">user.created, user.updated, user.deleted</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumes:</span>
                <span className="detail-value">None</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <h3 style={{ marginBottom: '1rem' }}>Order Service</h3>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">Producer + Consumer + gRPC Client</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Publishes:</span>
                <span className="detail-value">order.created, order.status.updated</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumes:</span>
                <span className="detail-value">user.created, inventory.updated, payment.processed</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Client:</span>
                <span className="detail-value">Calls Payment Service & Inventory Service</span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <h3 style={{ marginBottom: '1rem' }}>Payment Service</h3>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">Producer + Consumer + gRPC Server</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Publishes:</span>
                <span className="detail-value">payment.processed, payment.failed, payment.refunded</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumes:</span>
                <span className="detail-value">order.created (optional)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">Exposes ProcessPayment, RefundPayment, GetPaymentStatus</span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <h3 style={{ marginBottom: '1rem' }}>Inventory Service</h3>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">Producer + Consumer + gRPC Server</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Publishes:</span>
                <span className="detail-value">inventory.updated, inventory.low</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumes:</span>
                <span className="detail-value">order.created</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC Server:</span>
                <span className="detail-value">Exposes CheckStock, ReserveInventory, ReleaseInventory</span>
              </div>
            </div>
          </div>

          <div className="api-item">
            <h3 style={{ marginBottom: '1rem' }}>Notification Service</h3>
            <div className="api-details">
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">Consumer Only</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Publishes:</span>
                <span className="detail-value">None</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consumes:</span>
                <span className="detail-value">All topics from all services</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">gRPC:</span>
                <span className="detail-value">No</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KafkaEventsPage


import { useState, useEffect } from 'react'
import axios from 'axios'
import '../App.css'

interface EventLog {
  id: string
  topic: string
  event: any
  receivedAt: string
  service: string
  producerService?: string
}

interface EventLogProps {
  apiBase: string
  serviceName: string
}

function EventLog({ apiBase, serviceName }: EventLogProps) {
  const [events, setEvents] = useState<EventLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiBase}/events`)
      if (res.data && res.data.data) {
        setEvents(res.data.data.reverse()) // Show newest first
      }
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [apiBase])

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h2 className="card-subtitle">
        📨 Real-Time Event Log
        <button 
          className="button" 
          onClick={fetchEvents} 
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Refresh
        </button>
      </h2>
      
      {loading && events.length === 0 && <div className="loading">Loading events...</div>}
      
      {events.length === 0 && !loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No events received yet. Events will appear here when {serviceName} receives Kafka messages.
        </div>
      )}

      <div className="event-list">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <span className="event-topic">📨 {event.topic}</span>
                {event.producerService && (
                  <span style={{ marginLeft: '1rem', color: '#667eea', fontSize: '0.9rem' }}>
                    from <strong>{event.producerService}</strong>
                  </span>
                )}
              </div>
              <span style={{ color: '#999', fontSize: '0.85rem' }}>
                {new Date(event.receivedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="event-data">
              {JSON.stringify(event.event, null, 2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventLog


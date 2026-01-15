import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Orders from './pages/Orders'
// Keep old pages for admin/testing
import UserServicePage from './pages/UserServicePage'
import OrderServicePage from './pages/OrderServicePage'
import PaymentServicePage from './pages/PaymentServicePage'
import InventoryServicePage from './pages/InventoryServicePage'
import NotificationServicePage from './pages/NotificationServicePage'
import KafkaEventsPage from './pages/KafkaEventsPage'
import './App.css'

function App() {
  const cartCount = JSON.parse(localStorage.getItem('cart') || '[]').length

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-title">
              🛍️ Kafka Shopping
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/cart" className="nav-link">
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders" className="nav-link">Orders</Link>
              <div className="nav-divider">|</div>
              <Link to="/admin/users" className="nav-link">Admin</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            {/* Shopping App Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            
            {/* Admin/Testing Routes */}
            <Route path="/admin/users" element={<UserServicePage />} />
            <Route path="/admin/orders" element={<OrderServicePage />} />
            <Route path="/admin/payments" element={<PaymentServicePage />} />
            <Route path="/admin/inventory" element={<InventoryServicePage />} />
            <Route path="/admin/notifications" element={<NotificationServicePage />} />
            <Route path="/admin/kafka" element={<KafkaEventsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App


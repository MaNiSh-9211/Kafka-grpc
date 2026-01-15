import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Checkout.css'

const ORDER_API = 'http://localhost:5002'
const USER_API = 'http://localhost:5001'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface ShippingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  })

  useEffect(() => {
    loadCart()
    loadUserId()
  }, [])

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
    if (cart.length === 0) {
      navigate('/cart')
    }
  }

  const loadUserId = () => {
    const savedUserId = localStorage.getItem('userId')
    if (savedUserId) {
      setUserId(savedUserId)
    } else {
      // Create a temporary user or prompt for login
      createTempUser()
    }
  }

  const createTempUser = async () => {
    try {
      const res = await axios.post(`${USER_API}/users`, {
        email: `guest-${Date.now()}@example.com`,
        name: 'Guest User'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const user = res.data?.data || res.data
      
      if (user && user.id) {
        setUserId(user.id)
        localStorage.setItem('userId', user.id)
        console.log('✅ Guest user created:', user.id)
      } else {
        console.error('Invalid user response:', user)
      }
    } catch (err: any) {
      console.error('Error creating user:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
    }
  }

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
  }

  const handlePlaceOrder = async () => {
    if (!userId) {
      setError('Please login or create an account')
      return
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      setError('Please fill in all shipping address fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      }))

      const orderData = {
        userId,
        items: orderItems,
        shippingAddress
      }

      const res = await axios.post(`${ORDER_API}/orders`, orderData, {
        timeout: 30000, // 30 second timeout for order creation
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const order = res.data?.data || res.data
      
      if (!order || !order.id) {
        setError('Invalid order response from server')
        return
      }

      // Clear cart
      localStorage.removeItem('cart')

      // Navigate to order confirmation
      navigate(`/order/${order.id}`, { state: { order } })
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to place order. Please try again.'
      setError(errorMessage)
      console.error('Error placing order:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const shipping = subtotal > 100 ? 0 : 10
  const total = subtotal + tax + shipping

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-form-section">
          <div className="form-section">
            <h2>Shipping Address</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Order Items</h2>
            <div className="order-items-list">
              {cartItems.map(item => (
                <div key={item.productId} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="order-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            onClick={handlePlaceOrder}
            className="place-order-btn"
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          <button 
            onClick={() => navigate('/cart')}
            className="back-to-cart-btn"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout


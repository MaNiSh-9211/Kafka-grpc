import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Cart.css'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId)
      return
    }

    const updatedCart = cartItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.productId !== productId)
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([])
      localStorage.removeItem('cart')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax
  const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
  const total = subtotal + tax + shipping

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      
      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-header">
            <span>Item</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
            <span></span>
          </div>

          {cartItems.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-image">
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/100'} 
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100'
                  }}
                />
              </div>
              <div className="cart-item-name">
                <Link to={`/product/${item.productId}`}>{item.name}</Link>
              </div>
              <div className="cart-item-price">${item.price.toFixed(2)}</div>
              <div className="cart-item-quantity">
                <button 
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="quantity-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                  min="1"
                  className="quantity-input"
                />
                <button 
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button 
                onClick={() => removeItem(item.productId)}
                className="remove-btn"
                title="Remove item"
              >
                ×
              </button>
            </div>
          ))}

          <button onClick={clearCart} className="clear-cart-btn">
            Clear Cart
          </button>
        </div>

        <div className="cart-summary">
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
          {subtotal < 100 && (
            <div className="shipping-note">
              Add ${(100 - subtotal).toFixed(2)} more for free shipping!
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => navigate('/checkout')}
            className="checkout-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
          <Link to="/" className="continue-shopping-link">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart


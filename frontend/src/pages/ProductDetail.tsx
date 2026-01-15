import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './ProductDetail.css'

const INVENTORY_API = 'http://localhost:5004'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  imageBase64?: string
  availableQuantity: number
  category?: string
  brand?: string
  sku?: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
  }, [id])

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${INVENTORY_API}/products/${productId}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const productData = res.data?.data || res.data
      
      if (!productData || !productData.id) {
        setError('Invalid product data received')
        return
      }
      
      setProduct(productData)
      console.log('✅ Product loaded:', productData.name)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Product not found'
      setError(errorMessage)
      console.error('Error fetching product:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        productId
      })
    } finally {
      setLoading(false)
    }
  }

  const getProductImage = (product: Product): string => {
    if (product.imageBase64) {
      return product.imageBase64.startsWith('data:') 
        ? product.imageBase64 
        : `data:image/png;base64,${product.imageBase64}`
    }
    if (product.imageUrl) {
      return product.imageUrl
    }
    return `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`
  }

  const addToCart = () => {
    if (!product) return

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: getProductImage(product)
    }

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = existingCart.findIndex((item: CartItem) => item.productId === product.id)

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity
    } else {
      existingCart.push(cartItem)
    }

    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    // Show success message
    alert(`Added ${quantity} ${product.name}(s) to cart!`)
    
    // Navigate to cart or stay on page
    const goToCart = window.confirm('Go to cart?')
    if (goToCart) {
      navigate('/cart')
    }
  }

  const handleQuantityChange = (delta: number) => {
    if (!product) return
    const newQuantity = Math.max(1, Math.min(quantity + delta, product.availableQuantity))
    setQuantity(newQuantity)
  }

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">{error || 'Product not found'}</div>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate('/')} className="back-button">
        ← Back to Products
      </button>

      <div className="product-detail-grid">
        <div className="product-image-section">
          <img 
            src={getProductImage(product)} 
            alt={product.name}
            className="product-detail-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`
            }}
          />
        </div>

        <div className="product-info-section">
          {product.brand && (
            <div className="product-brand">{product.brand}</div>
          )}
          <h1 className="product-detail-name">{product.name}</h1>
          
          {product.sku && (
            <div className="product-sku">SKU: {product.sku}</div>
          )}

          <div className="product-price-section">
            <span className="product-detail-price">${product.price.toFixed(2)}</span>
            {product.availableQuantity > 0 ? (
              <span className="in-stock-badge">In Stock</span>
            ) : (
              <span className="out-of-stock-badge">Out of Stock</span>
            )}
          </div>

          <div className="product-description-section">
            <h3>Description</h3>
            <p>{product.description || 'No description available.'}</p>
          </div>

          {product.availableQuantity > 0 && (
            <div className="product-actions">
              <div className="quantity-selector">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="quantity-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantity(Math.max(1, Math.min(val, product.availableQuantity)))
                  }}
                  min="1"
                  max={product.availableQuantity}
                  className="quantity-input"
                />
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.availableQuantity}
                  className="quantity-btn"
                >
                  +
                </button>
                <span className="quantity-hint">
                  (Max: {product.availableQuantity})
                </span>
              </div>

              <button 
                onClick={addToCart}
                className="add-to-cart-btn"
                disabled={quantity > product.availableQuantity}
              >
                Add to Cart
              </button>
            </div>
          )}

          {product.availableQuantity === 0 && (
            <div className="out-of-stock-message">
              This product is currently out of stock.
            </div>
          )}

          <div className="product-meta">
            <div className="meta-item">
              <strong>Category:</strong> {product.category || 'Uncategorized'}
            </div>
            <div className="meta-item">
              <strong>Available:</strong> {product.availableQuantity} units
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail


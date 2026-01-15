import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Home.css'

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
}

function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${INVENTORY_API}/products`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Handle response structure: { service: '...', data: [...], pagination: {...} }
      const productsData = res.data?.data || res.data || []
      
      if (!Array.isArray(productsData)) {
        console.error('Invalid products data format:', productsData)
        setError('Invalid response format from server')
        return
      }
      
      setProducts(productsData)
      console.log(`✅ Loaded ${productsData.length} products`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load products'
      setError(`Failed to load products: ${errorMessage}`)
      console.error('Error fetching products:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: `${INVENTORY_API}/products`
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
    // Generate placeholder
    return `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`
  }

  const categories = ['all', ...new Set(products.map(p => p.category || 'uncategorized').filter(Boolean))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.availableQuantity > 0
  })

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Kafka Shopping</h1>
        <p>Discover amazing products powered by microservices</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          filteredProducts.map(product => (
            <Link key={product.id} to={`/product/${product.id}`} className="product-card">
              <div className="product-image-container">
                <img 
                  src={getProductImage(product)} 
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`
                  }}
                />
                {product.availableQuantity < 10 && (
                  <span className="stock-badge">Only {product.availableQuantity} left!</span>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                {product.brand && <p className="product-brand">{product.brand}</p>}
                <p className="product-description">
                  {product.description?.substring(0, 100)}
                  {product.description && product.description.length > 100 ? '...' : ''}
                </p>
                <div className="product-footer">
                  <span className="product-price">${product.price.toFixed(2)}</span>
                  <span className="product-stock">
                    {product.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default Home


/**
 * Product Seeding Script
 * 
 * Seeds the database with comprehensive demo products for the shopping app.
 * Run this script to populate the inventory with sample products.
 * 
 * Usage: npm run seed or ts-node src/scripts/seedProducts.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { generatePlaceholderImage } from '../utils/imagePlaceholder';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Comprehensive demo products data with multiple categories
 */
const demoProducts = [
  // Electronics - Audio
  {
    name: 'Wireless Bluetooth Headphones Pro',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life, active noise cancellation, and premium sound quality. Perfect for music lovers and professionals.',
    price: 199.99,
    category: 'Electronics',
    totalQuantity: 150,
    availableQuantity: 150,
    reservedQuantity: 0,
    sku: 'ELEC-HEAD-001',
    brand: 'TechSound',
    tags: ['wireless', 'bluetooth', 'audio', 'premium', 'noise-cancelling'],
  },
  {
    name: 'Smart Watch Pro Series 8',
    description: 'Feature-rich smartwatch with heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water-resistant up to 50m. Perfect for fitness enthusiasts.',
    price: 299.99,
    category: 'Electronics',
    totalQuantity: 100,
    availableQuantity: 100,
    reservedQuantity: 0,
    sku: 'ELEC-WATCH-001',
    brand: 'TechTime',
    tags: ['smartwatch', 'fitness', 'wearable', 'health'],
  },
  {
    name: 'Mechanical Gaming Keyboard RGB',
    description: 'Professional gaming mechanical keyboard with RGB backlighting, Cherry MX switches, programmable keys, and aluminum frame. Perfect for gamers and developers.',
    price: 129.99,
    category: 'Electronics',
    totalQuantity: 80,
    availableQuantity: 80,
    reservedQuantity: 0,
    sku: 'ELEC-KEY-001',
    brand: 'GameTech',
    tags: ['keyboard', 'gaming', 'mechanical', 'rgb', 'programmable'],
  },
  {
    name: 'Portable External SSD 1TB',
    description: 'Ultra-fast portable SSD with USB-C connectivity. Read speeds up to 1050MB/s, write speeds up to 1000MB/s. Perfect for backups, file transfers, and video editing.',
    price: 149.99,
    category: 'Electronics',
    totalQuantity: 120,
    availableQuantity: 120,
    reservedQuantity: 0,
    sku: 'ELEC-SSD-001',
    brand: 'StorageTech',
    tags: ['ssd', 'storage', 'external', 'portable', 'fast'],
  },
  {
    name: 'Webcam HD 1080p Pro',
    description: 'High-definition webcam with auto-focus, built-in dual microphones, privacy shutter, and 1080p video quality. Perfect for video calls, streaming, and content creation.',
    price: 79.99,
    category: 'Electronics',
    totalQuantity: 90,
    availableQuantity: 90,
    reservedQuantity: 0,
    sku: 'ELEC-CAM-001',
    brand: 'VideoTech',
    tags: ['webcam', 'video', 'conference', 'hd', 'streaming'],
  },
  {
    name: 'Wireless Earbuds Pro',
    description: 'True wireless earbuds with active noise cancellation, 8-hour battery life, wireless charging case, and premium sound quality. Perfect for on-the-go listening.',
    price: 159.99,
    category: 'Electronics',
    totalQuantity: 200,
    availableQuantity: 200,
    reservedQuantity: 0,
    sku: 'ELEC-EAR-001',
    brand: 'TechSound',
    tags: ['earbuds', 'wireless', 'audio', 'noise-cancelling'],
  },
  
  // Accessories
  {
    name: 'Laptop Stand Ergonomic Aluminum',
    description: 'Adjustable aluminum laptop stand that improves posture and reduces neck strain. Fits laptops up to 17 inches. Ventilated design keeps laptop cool.',
    price: 49.99,
    category: 'Accessories',
    totalQuantity: 200,
    availableQuantity: 200,
    reservedQuantity: 0,
    sku: 'ACC-LAP-001',
    brand: 'ErgoDesk',
    tags: ['ergonomic', 'laptop', 'desk', 'accessory', 'stand'],
  },
  {
    name: 'Wireless Mouse Ergonomic Pro',
    description: 'Comfortable wireless mouse with precision tracking, 2-year battery life, ergonomic design, and customizable buttons. Perfect for office and home use.',
    price: 39.99,
    category: 'Accessories',
    totalQuantity: 250,
    availableQuantity: 250,
    reservedQuantity: 0,
    sku: 'ACC-MOU-001',
    brand: 'ErgoDesk',
    tags: ['mouse', 'wireless', 'ergonomic', 'accessory', 'precision'],
  },
  {
    name: 'USB-C Hub Multiport 7-in-1',
    description: '7-in-1 USB-C hub with HDMI 4K, 3x USB 3.0 ports, SD/TF card reader, and 100W power delivery. Perfect for MacBook, iPad Pro, and modern laptops.',
    price: 59.99,
    category: 'Accessories',
    totalQuantity: 180,
    availableQuantity: 180,
    reservedQuantity: 0,
    sku: 'ACC-HUB-001',
    brand: 'ConnectPro',
    tags: ['usb-c', 'hub', 'adapter', 'accessory', 'multiport'],
  },
  {
    name: 'Desk Lamp LED Adjustable',
    description: 'Modern LED desk lamp with touch control, 5 brightness levels, 3 color temperatures, USB charging port, and memory function. Perfect for work and study.',
    price: 34.99,
    category: 'Accessories',
    totalQuantity: 300,
    availableQuantity: 300,
    reservedQuantity: 0,
    sku: 'ACC-LAMP-001',
    brand: 'LightPro',
    tags: ['lamp', 'led', 'desk', 'lighting', 'adjustable'],
  },
  {
    name: 'Laptop Sleeve Protective',
    description: 'Water-resistant laptop sleeve with padding protection and premium materials. Fits laptops up to 15.6 inches. Available in multiple colors.',
    price: 24.99,
    category: 'Accessories',
    totalQuantity: 400,
    availableQuantity: 400,
    reservedQuantity: 0,
    sku: 'ACC-SLEEVE-001',
    brand: 'ProtectCase',
    tags: ['sleeve', 'protection', 'laptop', 'case', 'water-resistant'],
  },
  {
    name: 'Wireless Charging Pad Fast',
    description: 'Fast wireless charging pad compatible with Qi-enabled devices. LED indicator, anti-slip design, and supports up to 15W fast charging.',
    price: 29.99,
    category: 'Accessories',
    totalQuantity: 220,
    availableQuantity: 220,
    reservedQuantity: 0,
    sku: 'ACC-CHRG-001',
    brand: 'PowerTech',
    tags: ['wireless', 'charging', 'qi', 'accessory', 'fast-charge'],
  },
  {
    name: 'Monitor Stand with Storage',
    description: 'Sturdy monitor stand with built-in storage compartments and cable management. Raises monitor to eye level and organizes desk space efficiently.',
    price: 44.99,
    category: 'Accessories',
    totalQuantity: 160,
    availableQuantity: 160,
    reservedQuantity: 0,
    sku: 'ACC-MON-001',
    brand: 'ErgoDesk',
    tags: ['monitor', 'stand', 'storage', 'desk', 'cable-management'],
  },
  
  // Clothing
  {
    name: 'Cotton T-Shirt Premium',
    description: '100% organic cotton t-shirt with premium fit and soft fabric. Available in multiple colors and sizes. Perfect for everyday wear.',
    price: 24.99,
    category: 'Clothing',
    totalQuantity: 500,
    availableQuantity: 500,
    reservedQuantity: 0,
    sku: 'CLO-TEE-001',
    brand: 'ComfortWear',
    tags: ['tshirt', 'cotton', 'casual', 'comfortable'],
  },
  {
    name: 'Denim Jeans Classic Fit',
    description: 'Classic fit denim jeans with stretch fabric for comfort. Available in multiple sizes and washes. Perfect for casual and semi-formal occasions.',
    price: 59.99,
    category: 'Clothing',
    totalQuantity: 300,
    availableQuantity: 300,
    reservedQuantity: 0,
    sku: 'CLO-JEAN-001',
    brand: 'DenimCo',
    tags: ['jeans', 'denim', 'casual', 'classic'],
  },
  {
    name: 'Hoodie Zip-Up Premium',
    description: 'Premium zip-up hoodie with soft fleece lining, adjustable hood, and front pockets. Perfect for cool weather and casual wear.',
    price: 49.99,
    category: 'Clothing',
    totalQuantity: 250,
    availableQuantity: 250,
    reservedQuantity: 0,
    sku: 'CLO-HOOD-001',
    brand: 'ComfortWear',
    tags: ['hoodie', 'zip-up', 'warm', 'casual'],
  },
  
  // Home & Kitchen
  {
    name: 'Coffee Maker Programmable',
    description: '12-cup programmable coffee maker with auto-shutoff, brew strength control, and reusable filter. Perfect for coffee lovers.',
    price: 39.99,
    category: 'Home & Kitchen',
    totalQuantity: 150,
    availableQuantity: 150,
    reservedQuantity: 0,
    sku: 'HOME-COFFEE-001',
    brand: 'BrewMaster',
    tags: ['coffee', 'maker', 'programmable', 'kitchen'],
  },
  {
    name: 'Air Fryer Digital 5.5QT',
    description: 'Digital air fryer with 5.5-quart capacity, touchscreen controls, and 7 cooking presets. Healthier cooking with less oil.',
    price: 89.99,
    category: 'Home & Kitchen',
    totalQuantity: 120,
    availableQuantity: 120,
    reservedQuantity: 0,
    sku: 'HOME-AIRFRY-001',
    brand: 'CookPro',
    tags: ['air-fryer', 'cooking', 'healthy', 'kitchen'],
  },
  {
    name: 'Stand Mixer Professional',
    description: 'Professional stand mixer with 5-quart bowl, 10-speed settings, and multiple attachments. Perfect for baking enthusiasts.',
    price: 199.99,
    category: 'Home & Kitchen',
    totalQuantity: 80,
    availableQuantity: 80,
    reservedQuantity: 0,
    sku: 'HOME-MIXER-001',
    brand: 'BakePro',
    tags: ['mixer', 'baking', 'kitchen', 'professional'],
  },
  
  // Sports & Outdoors
  {
    name: 'Yoga Mat Premium Non-Slip',
    description: 'Premium yoga mat with non-slip surface, extra cushioning, and carrying strap. Perfect for yoga, pilates, and fitness workouts.',
    price: 29.99,
    category: 'Sports & Outdoors',
    totalQuantity: 200,
    availableQuantity: 200,
    reservedQuantity: 0,
    sku: 'SPORT-YOGA-001',
    brand: 'FitLife',
    tags: ['yoga', 'mat', 'fitness', 'exercise'],
  },
  {
    name: 'Water Bottle Insulated 32oz',
    description: 'Stainless steel insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and leak-proof.',
    price: 24.99,
    category: 'Sports & Outdoors',
    totalQuantity: 300,
    availableQuantity: 300,
    reservedQuantity: 0,
    sku: 'SPORT-BOTTLE-001',
    brand: 'HydratePro',
    tags: ['water-bottle', 'insulated', 'sports', 'eco-friendly'],
  },
  {
    name: 'Dumbbell Set Adjustable',
    description: 'Adjustable dumbbell set with weight range from 5-50 lbs per dumbbell. Space-saving design perfect for home gyms.',
    price: 199.99,
    category: 'Sports & Outdoors',
    totalQuantity: 100,
    availableQuantity: 100,
    reservedQuantity: 0,
    sku: 'SPORT-DUMB-001',
    brand: 'FitLife',
    tags: ['dumbbell', 'weights', 'fitness', 'home-gym'],
  },
  
  // Books
  {
    name: 'Programming Book: TypeScript Mastery',
    description: 'Comprehensive guide to TypeScript covering advanced patterns, best practices, and real-world applications. Perfect for developers.',
    price: 39.99,
    category: 'Books',
    totalQuantity: 150,
    availableQuantity: 150,
    reservedQuantity: 0,
    sku: 'BOOK-TS-001',
    brand: 'TechBooks',
    tags: ['book', 'programming', 'typescript', 'education'],
  },
  {
    name: 'Microservices Architecture Guide',
    description: 'Complete guide to building microservices with Kafka, gRPC, and modern patterns. Includes real-world examples and best practices.',
    price: 49.99,
    category: 'Books',
    totalQuantity: 120,
    availableQuantity: 120,
    reservedQuantity: 0,
    sku: 'BOOK-MICRO-001',
    brand: 'TechBooks',
    tags: ['book', 'microservices', 'architecture', 'education'],
  },
];

/**
 * Seed products into database
 */
async function seedProducts() {
  try {
    // Connect to MongoDB
    // Use the same MongoDB URI pattern as the main service
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://USER:PASSWORD@cluster.mongodb.net/inventory-management?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB...');
    console.log(`MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in log
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing products (optional - comment out if you want to keep existing)
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Generate placeholder images and insert products
    console.log('Seeding products...');
    const productsWithImages = demoProducts.map((product) => {
      // Generate placeholder image based on SKU
      const placeholderImage = generatePlaceholderImage(product.sku, 400, 400);
      return {
        id: uuidv4(), // Generate unique ID
        ...product,
        imageBase64: placeholderImage, // Store as base64 data URL
        rating: Math.random() * 2 + 3, // Random rating 3-5
        reviewCount: Math.floor(Math.random() * 100),
        featured: Math.random() > 0.7, // 30% featured
      };
    });

    const insertedProducts = await Product.insertMany(productsWithImages);
    console.log(`✅ Successfully seeded ${insertedProducts.length} products`);

    // Display summary by category
    console.log('\n📦 Product Summary by Category:');
    const byCategory: Record<string, number> = {};
    insertedProducts.forEach((product) => {
      byCategory[product.category] = (byCategory[product.category] || 0) + 1;
      console.log(`  - ${product.name} (${product.sku}): $${product.price} - Stock: ${product.availableQuantity} - Category: ${product.category}`);
    });
    
    console.log('\n📊 Category Breakdown:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts();
}

export { seedProducts };

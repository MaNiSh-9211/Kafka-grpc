/**
 * HTTP Routes for Inventory Service
 */

import { Express, Request, Response } from 'express';
import { log } from './utils/logger';
import { KafkaProducer } from './utils/kafka';
import { Product } from './models/Product';
import { Reservation } from './models/Reservation';
import { getProductImage } from './utils/imagePlaceholder';

export function setupRoutes(
  app: Express,
  kafkaProducer: KafkaProducer
): void {
  app.get('/events', (req: Request, res: Response) => {
    res.json({
      service: 'inventory-service',
      data: (global as any).eventLogs || []
    });
  });

  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy', 
      service: 'inventory-service',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get All Products
   * GET /products
   * Supports query params: category, search, page, limit
   */
  app.get('/products', async (req: Request, res: Response) => {
    try {
      const { category, search, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = {};
      if (category) {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }

      const products = await Product.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      // Add image URLs (generate placeholders if missing)
      const productsWithImages = products.map(product => {
        const productObj = product.toJSON();
        if (!productObj.imageBase64 && !productObj.imageUrl) {
          productObj.imageBase64 = getProductImage(productObj);
        }
        return productObj;
      });

      const total = await Product.countDocuments(query);

      res.json({
        service: 'inventory-service',
        data: productsWithImages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      log.error('Error fetching products:', error as Record<string, any>);
      res.status(500).json({
        service: 'inventory-service',
        error: 'Failed to fetch products'
      });
    }
  });

  /**
   * Get Product by ID
   * GET /products/:id
   */
  app.get('/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ id });
      
      if (!product) {
        return res.status(404).json({ 
          service: 'inventory-service',
          error: 'Product not found' 
        });
      }

      const productObj = product.toJSON();
      // Generate placeholder if no image
      if (!productObj.imageBase64 && !productObj.imageUrl) {
        productObj.imageBase64 = getProductImage(productObj);
      }

      res.json({
        service: 'inventory-service',
        data: productObj
      });
    } catch (error: any) {
      log.error('Error fetching product:', error as Record<string, any>);
      res.status(500).json({
        service: 'inventory-service',
        error: 'Failed to fetch product'
      });
    }
  });

  /**
   * Get Categories
   * GET /products/categories
   */
  app.get('/products/categories', async (req: Request, res: Response) => {
    try {
      const categories = await Product.distinct('category');
      res.json({
        service: 'inventory-service',
        data: categories.filter(Boolean)
      });
    } catch (error) {
      log.error('Error fetching categories:', error as Record<string, any>);
      res.status(500).json({
        service: 'inventory-service',
        error: 'Failed to fetch categories'
      });
    }
  });

  /**
   * Get Reservations
   * GET /reservations
   */
  app.get('/reservations', async (req: Request, res: Response) => {
    try {
      const reservations = await Reservation.find().sort({ createdAt: -1 });
      res.json({
        service: 'inventory-service',
        data: reservations.map(r => r.toJSON())
      });
    } catch (error) {
      log.error('Error fetching reservations:', error as Record<string, any>);
      res.status(500).json({
        service: 'inventory-service',
        error: 'Failed to fetch reservations'
      });
    }
  });
}


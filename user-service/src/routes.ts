/**
 * HTTP Routes for User Service
 * 
 * Production-grade routes with MongoDB integration
 */

import { Express, Request, Response } from 'express';
import { log } from './utils/logger';
import { KafkaProducer } from './utils/kafka';
import { User } from './models/User';
import bcrypt from 'bcryptjs';

/**
 * Setup all HTTP routes for the User Service
 */
export function setupRoutes(
  app: Express,
  kafkaProducer: KafkaProducer
): void {
  /**
   * Event Log Endpoint
   */
  app.get('/events', (req: Request, res: Response) => {
    res.json({
      service: 'user-service',
      data: (global as any).eventLogs || []
    });
  });

  /**
   * Health Check Endpoint
   */
  app.get('/health', async (req: Request, res: Response) => {
    try {
      // Check MongoDB connection
      const dbStatus = require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected';
      
      res.json({ 
        status: 'healthy', 
        service: 'user-service',
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'user-service',
        error: 'Database connection failed'
      });
    }
  });

  /**
   * Create User Endpoint
   * POST /users
   */
  app.post('/users', async (req: Request, res: Response) => {
    try {
      const { email, name, password, address, phone } = req.body;

      // Input validation
      if (!email || !name) {
        return res.status(400).json({
          service: 'user-service',
          error: 'Email and name are required',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingUser) {
        return res.status(409).json({
          service: 'user-service',
          error: 'User with this email already exists',
        });
      }

      // Hash password if provided
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        address,
        phone,
        role: 'customer',
      });

      await user.save();

      // Publish event to Kafka
      await kafkaProducer.send('user.created', {
        type: 'user.created',
        userId: user.id,
        email: user.email,
        name: user.name,
        timestamp: user.createdAt.toISOString(),
      }, user.id);

      // Log event
      const eventLog = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        topic: 'user.created',
        event: { userId: user.id, email: user.email, name: user.name },
        receivedAt: new Date().toISOString(),
        service: 'user-service',
      };
      if (!(global as any).eventLogs) (global as any).eventLogs = [];
      (global as any).eventLogs.push(eventLog);

      log.info('[USER-SERVICE] ✅ User created', { 
        userId: user.id, 
        email: user.email 
      });

      res.status(201).json({
        service: 'user-service',
        data: user.toJSON()
      });
    } catch (error: any) {
      log.error('[USER-SERVICE] ❌ Error creating user:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          service: 'user-service',
          error: 'Validation error',
          details: Object.values(error.errors).map((e: any) => e.message),
        });
      }

      res.status(500).json({ 
        service: 'user-service',
        error: 'Internal server error' 
      });
    }
  });

  /**
   * Get User by ID Endpoint
   * GET /users/:id
   */
  app.get('/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ 
          service: 'user-service',
          error: 'User not found' 
        });
      }

      res.json({
        service: 'user-service',
        data: user.toJSON()
      });
    } catch (error: any) {
      log.error('[USER-SERVICE] ❌ Error fetching user:', error);
      res.status(500).json({
        service: 'user-service',
        error: 'Internal server error'
      });
    }
  });

  /**
   * Get All Users Endpoint
   * GET /users
   */
  app.get('/users', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      let query: any = {};
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        };
      }

      const [users, total] = await Promise.all([
        User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        User.countDocuments(query),
      ]);
      
      res.json({
        service: 'user-service',
        data: users.map(u => u.toJSON()),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      log.error('[USER-SERVICE] ❌ Error fetching users:', error);
      res.status(500).json({
        service: 'user-service',
        error: 'Internal server error'
      });
    }
  });

  /**
   * Update User Endpoint
   * PUT /users/:id
   */
  app.put('/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, address, phone } = req.body;

      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ 
          service: 'user-service',
          error: 'User not found' 
        });
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (address) user.address = { ...user.address, ...address };
      if (phone) user.phone = phone;

      await user.save();

      // Publish update event
      await kafkaProducer.send('user.updated', {
        type: 'user.updated',
        userId: user.id,
        email: user.email,
        name: user.name,
        timestamp: user.updatedAt.toISOString(),
      }, user.id);

      log.info('[USER-SERVICE] ✅ User updated', { 
        userId: user.id 
      });

      res.json({
        service: 'user-service',
        data: user.toJSON()
      });
    } catch (error: any) {
      log.error('[USER-SERVICE] ❌ Error updating user:', error);
      res.status(500).json({ 
        service: 'user-service',
        error: 'Internal server error' 
      });
    }
  });

  /**
   * Delete User Endpoint
   * DELETE /users/:id
   */
  app.delete('/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ 
          service: 'user-service',
          error: 'User not found' 
        });
      }

      // Publish delete event
      await kafkaProducer.send('user.deleted', {
        type: 'user.deleted',
        userId: id,
        timestamp: new Date().toISOString(),
      }, id);

      log.info('[USER-SERVICE] ✅ User deleted', { 
        userId: id 
      });

      res.status(204).send();
    } catch (error: any) {
      log.error('[USER-SERVICE] ❌ Error deleting user:', error);
      res.status(500).json({ 
        service: 'user-service',
        error: 'Internal server error' 
      });
    }
  });
}

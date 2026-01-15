/**
 * HTTP Routes for Notification Service
 */

import { Express, Request, Response } from 'express';
import { log } from './utils/logger';
import { notifications } from './index';

export function setupRoutes(
  app: Express,
  notifications: Map<string, any>
): void {
  app.get('/events', (req: Request, res: Response) => {
    res.json({
      service: 'notification-service',
      data: (global as any).eventLogs || []
    });
  });

  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy', 
      service: 'notification-service',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/notifications', (req: Request, res: Response) => {
    const allNotifications = Array.from(notifications.values());
    res.json({
      service: 'notification-service',
      data: allNotifications
    });
  });

  app.get('/notifications/user/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const userNotifications = Array.from(notifications.values()).filter(
      (n) => n.userId === userId
    );
    res.json({
      service: 'notification-service',
      data: userNotifications
    });
  });

  app.get('/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = notifications.get(id);

    if (!notification) {
      return res.status(404).json({ 
        service: 'notification-service',
        error: 'Notification not found' 
      });
    }

    res.json({
      service: 'notification-service',
      data: notification
    });
  });
}


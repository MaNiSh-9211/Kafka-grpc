/**
 * Notification Model
 * 
 * Mongoose schema for Notification documents in MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Notification interface extending Mongoose Document
 */
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification Schema
 */
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
      required: [true, 'Channel is required'],
      default: 'EMAIL',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    sentAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);


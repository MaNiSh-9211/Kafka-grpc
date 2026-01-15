/**
 * Reservation Model
 * 
 * Mongoose schema for Inventory Reservation documents in MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Reservation interface extending Mongoose Document
 */
export interface IReservation extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Unique reservation ID
  orderId: string;
  productId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'FULFILLED';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reservation Schema
 */
const ReservationSchema = new Schema<IReservation>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      index: true,
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'RELEASED', 'FULFILLED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      // Reservations expire after 30 minutes if not confirmed
      default: () => new Date(Date.now() + 30 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        // Keep the id field, remove _id
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret: any) => {
        // Keep the id field, remove _id
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ReservationSchema.index({ orderId: 1, status: 1 });
ReservationSchema.index({ productId: 1, status: 1 });
ReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);


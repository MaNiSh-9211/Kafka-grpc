/**
 * Payment Model
 * 
 * Mongoose schema for Payment documents in MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Payment interface extending Mongoose Document
 */
export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'SIMULATED';
  transactionId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Schema
 */
const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      enum: ['USD', 'EUR', 'GBP', 'INR'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'SIMULATED'],
      default: 'SIMULATED',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined but enforce uniqueness when present
    },
    failureReason: {
      type: String,
      trim: true,
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
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);


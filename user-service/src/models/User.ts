/**
 * User Model
 * 
 * Mongoose schema for User documents in MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * User interface extending Mongoose Document
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password?: string; // Hashed password
  role: 'customer' | 'admin';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Schema
 * 
 * Defines the structure and validation rules for User documents
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // unique: true automatically creates an index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      // Removed index: true to avoid duplicate index warning
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    password: {
      type: String,
      select: false, // Don't return password by default
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'USA' },
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        if (ret.password !== undefined) delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        if (ret._id !== undefined) delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
        if (ret.password !== undefined) delete ret.password;
        return ret;
      },
    },
  }
);

// email index is automatically created by unique: true, so we don't need to define it again

// Export the model
export const User = mongoose.model<IUser>('User', UserSchema);


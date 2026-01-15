/**
 * Product Model
 * 
 * Mongoose schema for Product documents in MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Product interface extending Mongoose Document
 */
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Unique product ID (separate from _id)
  name: string;
  description: string;
  price: number;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  imageBase64?: string; // Base64 encoded product image
  imageUrl?: string; // URL to product image
  sku: string; // Stock Keeping Unit
  brand?: string;
  tags?: string[];
  rating?: number; // Average rating (0-5)
  reviewCount?: number; // Number of reviews
  featured?: boolean; // Featured product flag
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Schema
 */
const ProductSchema = new Schema<IProduct>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true, // Index for search
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative'],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    imageBase64: {
      type: String,
      // Base64 image data (optional - will use placeholder if not provided)
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true, // unique: true automatically creates an index
      trim: true,
      uppercase: true,
      // Removed index: true to avoid duplicate index warning
    },
    brand: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
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

// Indexes for common queries
ProductSchema.index({ category: 1, price: 1 });
// sku index is automatically created by unique: true, so we don't need to define it again
ProductSchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual to check if product is in stock
ProductSchema.virtual('inStock').get(function () {
  return this.availableQuantity > 0;
});

// Pre-save hook to ensure availableQuantity + reservedQuantity <= totalQuantity
ProductSchema.pre('save', function (next) {
  if (this.availableQuantity + this.reservedQuantity > this.totalQuantity) {
    return next(new Error('Available + Reserved quantity cannot exceed total quantity'));
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);


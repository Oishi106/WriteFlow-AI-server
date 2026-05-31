import mongoose, { Schema } from 'mongoose';
import { IItem } from '../types';

const itemSchema = new Schema<IItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['blog', 'social', 'email', 'ad-copy', 'travel', 'restaurant', 'product', 'event', 'property'],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

itemSchema.index({ title: 'text', description: 'text', category: 'text' });

export const Item = mongoose.model<IItem>('Item', itemSchema);

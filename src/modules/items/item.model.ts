import mongoose, { Schema } from 'mongoose';
import { IItem } from '../../types';

const itemSchema = new Schema<IItem>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    image: { type: String },
    category: {
      type: String,
      enum: ['blog', 'social', 'email', 'ad-copy'],
      required: [true, 'Category is required'],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    tone: { type: String },
    estimatedWordCount: { type: Number },
    aiModel: {
      type: String,
      default: 'gemini-pro',
    },
    prompt: { type: String },
    sampleOutput: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Text search index
itemSchema.index({ title: 'text', description: 'text', category: 'text' });
itemSchema.index({ category: 1, rating: -1 });
itemSchema.index({ usageCount: -1 });
itemSchema.index({ createdAt: -1 });

export const Item = mongoose.model<IItem>('Item', itemSchema);

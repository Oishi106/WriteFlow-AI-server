import mongoose, { Schema } from 'mongoose';
import { ContentStatus, IDocument } from '../types';

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as ContentStatus[],
      default: 'DRAFT',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ title: 'text' });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

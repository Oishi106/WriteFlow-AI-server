import mongoose, { Schema } from 'mongoose';
import { IAILog } from '../../types';

const aiLogSchema = new Schema<IAILog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentUsed: {
      type: String,
      required: true,
      enum: ['Content Draft', 'Rewrite & Tone', 'Chat Assistant', 'Review Summariser'],
    },
    promptSnippet: {
      type: String,
      required: true,
      maxlength: 200,
    },
    tokensUsed: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

aiLogSchema.index({ userId: 1, createdAt: -1 });

export const AILog = mongoose.model<IAILog>('AILog', aiLogSchema);

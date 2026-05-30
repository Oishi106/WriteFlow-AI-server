import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';
export type UserPlan = 'FREE' | 'PRO' | 'TEAM';
export type UserStatus = 'ACTIVE' | 'BANNED';
export type ContentType = 'blog' | 'social' | 'email' | 'ad-copy';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  plan: UserPlan;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IItem extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  image?: string;
  category: ContentType;
  rating: number;
  usageCount: number;
  tone?: string;
  estimatedWordCount?: number;
  aiModel?: string;
  prompt?: string;
  sampleOutput?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  rating: number;
  comment: string;
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  approved: boolean;
  createdAt: Date;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  quantity: number;
  price: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAILog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  agentUsed: string;
  promptSnippet: string;
  tokensUsed: number;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sort?: string;
  rating?: string;
}

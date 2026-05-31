import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';
export type UserPlan = 'FREE' | 'PRO' | 'TEAM';
export type UserStatus = 'ACTIVE' | 'BANNED';
export type ContentType =
  | 'blog'
  | 'social'
  | 'email'
  | 'ad-copy'
  | 'travel'
  | 'restaurant'
  | 'product'
  | 'event'
  | 'property';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

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
  image: string;
  price: number;
  rating: number;
  location: string;
  category: ContentType;
  createdBy: Types.ObjectId;
  reviewCount: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  status: ContentStatus;
  userId: Types.ObjectId;
  wordCount: number;
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
  prompt: string;
  tokensUsed: number;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    _id?: string;
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

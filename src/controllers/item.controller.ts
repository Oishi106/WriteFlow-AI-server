import { Response } from 'express';
import type { SortOrder } from 'mongoose';
import { Item } from '../models/item.model';
import { AppError, asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const SORT_MAP: Record<string, Record<string, SortOrder>> = {
  price: { price: 1 },
  '-price': { price: -1 },
  '-rating': { rating: -1 },
  '-createdAt': { createdAt: -1 },
  createdAt: { createdAt: 1 },
};

const getSortOption = (sort?: string): Record<string, SortOrder> => {
  if (sort && SORT_MAP[sort]) {
    return SORT_MAP[sort];
  }
  return { createdAt: -1 };
};

export const getItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    search,
    category,
    priceMin,
    priceMax,
    rating,
    sort,
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (priceMin !== undefined) {
      priceFilter.$gte = Number(priceMin);
    }
    if (priceMax !== undefined) {
      priceFilter.$lte = Number(priceMax);
    }
    query.price = priceFilter;
  }

  if (rating !== undefined) {
    query.rating = { $gte: Number(rating) };
  }

  const sortOption = getSortOption(sort);

  const [items, total] = await Promise.all([
    Item.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort(sortOption)
      .populate('createdBy', 'name avatar'),
    Item.countDocuments(query),
  ]);

  return successResponse(res, 'Items fetched', items, 200, {
    page: pageNum,
    limit: limitNum,
    total,
  });
});

export const getItemById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    { $inc: { usageCount: 1 } },
    { new: true }
  ).populate('createdBy', 'name avatar');

  if (!item) {
    throw new AppError('Item not found.', 404);
  }

  return successResponse(res, 'Item retrieved successfully.', item);
});

export const createItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Item.create({ ...req.body, createdBy: req.user!.id });
  return successResponse(res, 'Item created successfully.', item, 201);
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!item) {
    throw new AppError('Item not found.', 404);
  }

  return successResponse(res, 'Item updated successfully.', item);
});

export const deleteItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Item.findByIdAndDelete(req.params.id);

  if (!item) {
    throw new AppError('Item not found.', 404);
  }

  return successResponse(res, 'Item deleted successfully.');
});

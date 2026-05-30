import { Router, Response } from 'express';
import { Item } from './item.model';
import { AppError, asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';
import type { SortOrder } from 'mongoose';

// ─── Service ───────────────────────────────────────────────────────────────────

interface GetItemsOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  rating?: number;
  sort?: string;
}

export const getItems = async (options: GetItemsOptions) => {
  const { page, limit, search, category, rating, sort } = options;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (rating) query.rating = { $gte: rating };

  let sortOption: Record<string, SortOrder> = { usageCount: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  else if (sort === 'rating') sortOption = { rating: -1 };
  else if (sort === 'popular') sortOption = { usageCount: -1 };

  const [items, total] = await Promise.all([
    Item.find(query).skip(skip).limit(limit).sort(sortOption).populate('createdBy', 'name avatar'),
    Item.countDocuments(query),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getItemById = async (id: string) => {
  const item = await Item.findByIdAndUpdate(id, { $inc: { usageCount: 1 } }, { new: true }).populate('createdBy', 'name avatar');
  if (!item) throw new AppError('Template not found.', 404);
  return item;
};

export const createItem = async (data: Partial<{ title: string; description: string; category: string; image: string; tone: string; estimatedWordCount: number; prompt: string; sampleOutput: string }>, userId: string) => {
  const item = await Item.create({ ...data, createdBy: userId });
  return item;
};

export const updateItem = async (id: string, data: Partial<Record<string, unknown>>) => {
  const item = await Item.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) throw new AppError('Template not found.', 404);
  return item;
};

export const deleteItem = async (id: string) => {
  const item = await Item.findByIdAndDelete(id);
  if (!item) throw new AppError('Template not found.', 404);
  return item;
};

export const getRelatedItems = async (itemId: string, category: string) => {
  return Item.find({ category, _id: { $ne: itemId } }).limit(4).sort({ rating: -1 });
};

// ─── Controller + Routes ──────────────────────────────────────────────────────

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '12', search, category, rating, sort } = req.query as Record<string, string>;
  const result = await getItems({ page: Number(page), limit: Number(limit), search, category, rating: rating ? Number(rating) : undefined, sort });
  return successResponse(res, 'Templates retrieved successfully.', result.items, 200, result.meta);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await getItemById(req.params.id);
  return successResponse(res, 'Template retrieved successfully.', item);
}));

router.get('/:id/related', asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw new AppError('Template not found.', 404);
  const related = await getRelatedItems(req.params.id, item.category);
  return successResponse(res, 'Related templates retrieved.', related);
}));

router.post('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await createItem(req.body, req.user!.id);
  return successResponse(res, 'Template created successfully.', item, 201);
}));

router.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await updateItem(req.params.id, req.body);
  return successResponse(res, 'Template updated successfully.', item);
}));

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteItem(req.params.id);
  return successResponse(res, 'Template deleted successfully.');
}));

export default router;

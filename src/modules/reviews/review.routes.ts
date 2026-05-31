import { Router, Response } from 'express';
import { Review } from './review.model';
import { Item } from '../../models/item.model';
import { AppError, asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';

const router = Router();

// POST /api/reviews — Create review
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rating, comment, itemId } = req.body;

  const existing = await Review.findOne({ userId: req.user!.id, itemId });
  if (existing) throw new AppError('You have already reviewed this template.', 409);

  const review = await Review.create({
    rating,
    comment,
    userId: req.user!.id,
    itemId,
    approved: false,
  });

  // Recalculate item's average rating
  const reviews = await Review.find({ itemId, approved: true });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Item.findByIdAndUpdate(itemId, { rating: Math.round(avgRating * 10) / 10 });
  }

  return successResponse(res, 'Review submitted successfully. It will be visible after approval.', review, 201);
}));

// GET /api/reviews/item/:itemId — Get reviews for an item
router.get('/item/:itemId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ itemId: req.params.itemId, approved: true })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar'),
    Review.countDocuments({ itemId: req.params.itemId, approved: true }),
  ]);

  return successResponse(res, 'Reviews retrieved successfully.', reviews, 200, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
}));

// GET /api/reviews — Admin: get all reviews
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', approved } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const query: Record<string, unknown> = {};
  if (approved !== undefined) query.approved = approved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 })
      .populate('userId', 'name email avatar')
      .populate('itemId', 'title category'),
    Review.countDocuments(query),
  ]);

  return successResponse(res, 'All reviews retrieved.', reviews, 200, {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)),
  });
}));

// PATCH /api/reviews/:id/approve — Admin: approve or reject
router.patch('/:id/approve', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { approved } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { approved }, { new: true });
  if (!review) throw new AppError('Review not found.', 404);
  return successResponse(res, `Review ${approved ? 'approved' : 'rejected'} successfully.`, review);
}));

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found.', 404);

  const isOwner = review.userId.toString() === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this review.', 403);

  await review.deleteOne();
  return successResponse(res, 'Review deleted successfully.');
}));

export default router;

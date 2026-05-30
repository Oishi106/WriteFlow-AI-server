import { Router, Response } from 'express';
import { Booking } from './booking.model';
import { AppError, asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';

const router = Router();

// POST /api/bookings
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId, quantity = 1, price } = req.body;

  const booking = await Booking.create({
    userId: req.user!.id,
    itemId,
    quantity,
    price,
    status: 'PENDING',
  });

  await booking.populate(['userId', 'itemId']);
  return successResponse(res, 'Booking created successfully.', booking, 201);
}));

// GET /api/bookings — Admin: all, User: own
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const query: Record<string, unknown> = {};
  if (req.user!.role !== 'ADMIN') query.userId = req.user!.id;
  if (status) query.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('itemId', 'title category image'),
    Booking.countDocuments(query),
  ]);

  return successResponse(res, 'Bookings retrieved successfully.', bookings, 200, {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)),
  });
}));

// PATCH /api/bookings/:id — Update status (Admin only)
router.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) throw new AppError('Booking not found.', 404);
  return successResponse(res, 'Booking status updated successfully.', booking);
}));

// DELETE /api/bookings/:id
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found.', 404);

  const isOwner = booking.userId.toString() === req.user!.id;
  if (!isOwner && req.user!.role !== 'ADMIN') throw new AppError('Not authorized.', 403);

  await booking.deleteOne();
  return successResponse(res, 'Booking cancelled successfully.');
}));

export default router;

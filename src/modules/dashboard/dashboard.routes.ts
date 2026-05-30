import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';
import { User } from '../users/user.model';
import { Item } from '../items/item.model';
import { Booking } from '../bookings/booking.model';
import { AILog } from '../ai/aiLog.model';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, authorize('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, totalItems, totalBookings, revenueResult, aiCallsToday, newUsersThisMonth] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { status: { $in: ['CONFIRMED', 'PENDING'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
    AILog.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
  ]);

  return successResponse(res, 'Dashboard stats retrieved.', {
    totalUsers,
    totalItems,
    totalBookings,
    totalRevenue: revenueResult[0]?.total || 0,
    aiCallsToday,
    newUsersThisMonth,
  });
}));

// GET /api/dashboard/chart-data
router.get('/chart-data', authenticate, authorize('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Daily AI usage (bar chart) - last 7 days
  const dailyAIUsage = await AILog.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        tokens: { $sum: '$tokensUsed' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // User signups - last 30 days (line chart)
  const userSignups = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Content type breakdown (pie chart)
  const contentBreakdown = await Item.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return successResponse(res, 'Chart data retrieved successfully.', {
    dailyAIUsage,
    userSignups,
    contentBreakdown,
  });
}));

// GET /api/dashboard/my-stats — User's own stats
router.get('/my-stats', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalDocuments, documentsThisMonth, aiLogs] = await Promise.all([
    AILog.countDocuments({ userId: req.user!.id }),
    AILog.countDocuments({ userId: req.user!.id, createdAt: { $gte: startOfMonth } }),
    AILog.aggregate([
      { $match: { userId: req.user!.id } },
      { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' }, count: { $sum: 1 } } },
    ]),
  ]);

  return successResponse(res, 'Your stats retrieved.', {
    totalDocuments,
    documentsThisMonth,
    totalTokensUsed: aiLogs[0]?.totalTokens || 0,
    totalAICalls: aiLogs[0]?.count || 0,
  });
}));

export default router;

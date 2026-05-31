import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';
import { AILog } from '../../models/ailog.model';
import { getChartData, getStats } from '../../controllers/dashboard.controller';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), getStats);
router.get('/chart-data', authenticate, authorize('ADMIN'), getChartData);

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

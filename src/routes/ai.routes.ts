import { Response, Router } from 'express';
import { chat, generateDescription, rewriteContent, reviewSummary } from '../controllers/ai.controller';
import { AILog } from '../models/ailog.model';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const router = Router();

router.post('/chat', authMiddleware, chat);
router.post('/generate-description', authMiddleware, generateDescription);
router.post('/rewrite', authMiddleware, rewriteContent);
router.post('/review-summary', authMiddleware, reviewSummary);
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
	const { page = '1', limit = '10', agentUsed } = req.query as Record<string, string>;
	const skip = (Number(page) - 1) * Number(limit);
	const query: Record<string, unknown> = { userId: req.user!.id };

	if (agentUsed) {
		query.agentUsed = agentUsed;
	}

	const [logs, total] = await Promise.all([
		AILog.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
		AILog.countDocuments(query),
	]);

	return successResponse(res, 'AI usage history retrieved.', logs, 200, {
		page: Number(page),
		limit: Number(limit),
		total,
		totalPages: Math.ceil(total / Number(limit)),
	});
}));

export default router;

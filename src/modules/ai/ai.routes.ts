import { Router, Response } from 'express';
import * as aiService from './ai.service';
import { AILog } from './aiLog.model';
import { Review } from '../reviews/review.model';
import { AppError, asyncHandler } from '../../utils/asyncHandler';
import { successResponse } from '../../utils/apiResponse';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AuthRequest } from '../../types';

const router = Router();

router.post('/generate', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { topic, tone = 'professional', targetAudience = 'general', contentType = 'blog' } = req.body;
  if (!topic) throw new AppError('Topic is required.', 400);
  const result = await aiService.generateContent(topic, tone, targetAudience, contentType, req.user!.id);
  return successResponse(res, 'Content generated successfully.', result);
}));

router.post('/rewrite', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, tone = 'formal', action = 'rewrite' } = req.body;
  if (!content) throw new AppError('Content is required.', 400);
  if (content.length > 5000) throw new AppError('Content too long. Maximum 5000 characters.', 400);
  const result = await aiService.rewriteContent(content, tone, action, req.user!.id);
  return successResponse(res, 'Content rewritten successfully.', result);
}));

router.post('/chat', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { messages, documentContext = '' } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new AppError('Messages array is required.', 400);
  }
  const result = await aiService.chatWithAssistant(messages, documentContext, req.user!.id);
  return successResponse(res, 'Response generated successfully.', result);
}));

router.post('/review-summary', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.body;
  const query = itemId ? { itemId, approved: true } : { approved: true };
  const reviews = await Review.find(query).select('rating comment').lean();
  if (reviews.length === 0) throw new AppError('No approved reviews found to summarise.', 404);
  const result = await aiService.summariseReviews(
    reviews.map((r) => ({ rating: r.rating, comment: r.comment })),
    req.user!.id
  );
  return successResponse(res, 'Reviews summarised successfully.', result);
}));

router.post('/generate-description', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, category } = req.body;
  if (!title) throw new AppError('Title is required.', 400);
  const result = await aiService.generateDescription(title, category || 'general', req.user!.id);
  return successResponse(res, 'Description generated successfully.', result);
}));

router.get('/history', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', agentUsed } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);
  const query: Record<string, unknown> = { userId: req.user!.id };
  if (agentUsed) query.agentUsed = agentUsed;
  const [logs, total] = await Promise.all([
    AILog.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    AILog.countDocuments(query),
  ]);
  return successResponse(res, 'AI usage history retrieved.', logs, 200, {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)),
  });
}));

export default router;
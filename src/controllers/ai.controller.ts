import { Response } from 'express';
import * as aiService from '../modules/ai/ai.service';
import { AILog } from '../models/ailog.model';
import { Review } from '../modules/reviews/review.model';
import { AppError, asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const logAILog = async (
  req: AuthRequest,
  agentUsed: 'Content Draft' | 'Rewrite & Tone' | 'Chat Assistant' | 'Review Summariser',
  prompt: string,
  tokensUsed: number
): Promise<void> => {
  await AILog.create({
    userId: req.user!._id || req.user!.id,
    agentUsed,
    prompt: prompt.slice(0, 200),
    tokensUsed,
  });
};

export const generateContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { topic, tone = 'professional', targetAudience = 'general', contentType = 'blog' } = req.body;
  if (!topic) throw new AppError('Topic is required.', 400);

  const result = await aiService.generateContent(topic, tone, targetAudience, contentType, req.user!.id);
  await logAILog(
    req,
    'Content Draft',
    `${contentType}: ${topic}`,
    result.tokensUsed || 0
  );

  return successResponse(res, 'Content generated successfully.', result.data);
});

export const rewriteContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, tone = 'formal', action = 'rewrite' } = req.body;
  if (!content) throw new AppError('Content is required.', 400);
  if (content.length > 5000) throw new AppError('Content too long. Maximum 5000 characters.', 400);

  const result = await aiService.rewriteContent(content, tone, action, req.user!.id);
  await logAILog(req, 'Rewrite & Tone', content, result.tokensUsed || 0);

  return successResponse(res, 'Content rewritten successfully.', result.data);
});

export const chatWithAssistant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { messages, documentContext = '' } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new AppError('Messages array is required.', 400);
  }

  const result = await aiService.chatWithAssistant(messages, documentContext, req.user!.id);
  const lastMessage = messages[messages.length - 1];
  await logAILog(req, 'Chat Assistant', lastMessage?.content || '', result.tokensUsed || 0);

  return successResponse(res, 'Response generated successfully.', result.data);
});

export const reviewSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.body;

  const query = itemId ? { itemId, approved: true } : { approved: true };
  const reviews = await Review.find(query).select('rating comment').lean();

  if (reviews.length === 0) throw new AppError('No approved reviews found to summarise.', 404);

  const result = await aiService.summariseReviews(
    reviews.map((r) => ({ rating: r.rating, comment: r.comment })),
    req.user!.id
  );

  await logAILog(req, 'Review Summariser', `Review summary: ${itemId || 'all'}`, result.tokensUsed || 0);

  return successResponse(res, 'Reviews summarised successfully.', result.data);
});

export const generateDescription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, category } = req.body;
  if (!title) throw new AppError('Title is required.', 400);

  const result = await aiService.generateDescription(title, category || 'general', req.user!.id);
  await logAILog(
    req,
    'Content Draft',
    `Description: ${title} (${category || 'general'})`,
    result.tokensUsed || 0
  );

  return successResponse(res, 'Description generated successfully.', result.data);
});

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', agentUsed } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const query: Record<string, unknown> = { userId: req.user!._id || req.user!.id };
  if (agentUsed) query.agentUsed = agentUsed;

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
});

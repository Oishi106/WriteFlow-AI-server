import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  chatWithAssistant,
  generateContent,
  generateDescription,
  getHistory,
  reviewSummary,
  rewriteContent,
} from '../../controllers/ai.controller';

const router = Router();

// POST /api/ai/generate — Content Draft Agent
router.post('/generate', authenticate, generateContent);

// POST /api/ai/rewrite — Rewrite & Tone Agent
router.post('/rewrite', authenticate, rewriteContent);

// POST /api/ai/chat — Chat Assistant Agent
router.post('/chat', authenticate, chatWithAssistant);

// POST /api/ai/review-summary — Review Summariser Agent (Admin)
router.post('/review-summary', authenticate, authorize('ADMIN'), reviewSummary);

// POST /api/ai/generate-description — Generate item description
router.post('/generate-description', authenticate, authorize('ADMIN'), generateDescription);

// GET /api/ai/history — User's AI usage history
router.get('/history', authenticate, getHistory);

export default router;

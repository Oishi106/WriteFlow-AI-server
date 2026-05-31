import { Router } from 'express';
import { chat, generateDescription, rewriteContent, reviewSummary } from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/chat', authMiddleware, chat);
router.post('/generate-description', authMiddleware, generateDescription);
router.post('/rewrite', authMiddleware, rewriteContent);
router.post('/review-summary', authMiddleware, reviewSummary);

export default router;

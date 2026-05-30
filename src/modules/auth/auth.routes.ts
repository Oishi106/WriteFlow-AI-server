import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  registerValidation,
  loginValidation,
} from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// GET /api/auth/me (protected)
router.get('/me', authenticate, getMe);

export default router;

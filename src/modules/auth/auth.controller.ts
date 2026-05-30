import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.registerUser(name, email, password);

  return successResponse(
    res,
    'Account created successfully! Welcome to WriteFlow AI.',
    { user, accessToken, refreshToken },
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

  return successResponse(res, 'Login successful. Welcome back!', { user, accessToken, refreshToken });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) return errorResponse(res, 'Refresh token is required.', 400);

  const tokens = await authService.refreshUserToken(token);
  return successResponse(res, 'Token refreshed successfully.', tokens);
});

export const getMe = asyncHandler(async (req: Request & { user?: { id: string } }, res: Response) => {
  return successResponse(res, 'User retrieved successfully.', { userId: req.user?.id });
});

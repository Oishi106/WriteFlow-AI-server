import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { User } from '../users/user.model';
import { AppError } from '../../utils/asyncHandler';
import { UserRole } from '../../types';

interface TokenPayload {
  id: string;
  role: UserRole;
  email: string;
}

const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
};

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password });
  const payload = { id: user._id.toString(), role: user.role, email: user.email };
  const tokens = generateTokens(payload);
  return { user, ...tokens };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (user.status === 'BANNED') throw new AppError('Your account has been suspended. Please contact support.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const payload = { id: user._id.toString(), role: user.role, email: user.email };
  const tokens = generateTokens(payload);
  return { user, ...tokens };
};

export const refreshUserToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'BANNED') throw new AppError('User not found or banned.', 401);

    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const tokens = generateTokens(payload);
    return tokens;
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }
};

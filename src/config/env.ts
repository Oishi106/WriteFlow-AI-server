import dotenv from 'dotenv';
import path from 'path';

// Forcefully resolve absolute path to .env file to prevent loading failure
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,

  // Forcefully direct check variables mapping strings fallback configurations
  bkash: {
    appKey: process.env.BKASH_APP_KEY || 'sandboxTokenizedAppKey5678',
    appSecret: process.env.BKASH_APP_SECRET || 'sandboxTokenizedAppSecretSecretKey9999',
    username: process.env.BKASH_USERNAME || 'sandboxTokenizedUser',
    password: process.env.BKASH_PASSWORD || 'sandboxTokenizedPassword1234',
    baseUrl: process.env.BKASH_BASE_URL || 'https://checkout.sandbox.bka.sh/v1.2.0-beta',
  }
};
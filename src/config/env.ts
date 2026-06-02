import dotenv from 'dotenv';
import path from 'path';

// ensure path configuration standard read handles accurately
dotenv.config();

// Required parameters checklist update করা হলো যেন system runtime crashes handle করতে পারে
const requiredEnvVars = [
  'MONGODB_URI', 
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'BKASH_APP_KEY',      // ◄── Required Validation parameters check mapping block
  'BKASH_APP_SECRET',
  'BKASH_USERNAME',
  'BKASH_PASSWORD',
  'BKASH_BASE_URL'
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,

  // ─── bKash Credentials Integration Configuration Block ───────────────────────
  bkash: {
    appKey: process.env.BKASH_APP_KEY!,
    appSecret: process.env.BKASH_APP_SECRET!,
    username: process.env.BKASH_USERNAME!,
    password: process.env.BKASH_PASSWORD!,
    baseUrl: process.env.BKASH_BASE_URL!,
  }
};
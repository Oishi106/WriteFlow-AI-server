import dotenv from 'dotenv';
import path from 'path';

// Forcefully resolve absolute path to .env file to prevent loading failure
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 1. Prothome interface ti declare korun jeno TypeScript shob chine
export interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  frontendUrl: string;
  bcryptRounds: number;
  geminiApiKey: string; // <-- TypeScript ekhon eta khub shundor bhabe chinbe
  bkash: {
    appKey: string;
    appSecret: string;
    username: string;
    password: string;
    baseUrl: string;
  };
}

// 2. Ekhon config object-er sathe : Config interface-ti jure din
export const config: Config = {
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
  
  // 👉 Gemini API Key configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Forcefully direct check variables mapping strings fallback configurations
  bkash: {
    appKey: process.env.BKASH_APP_KEY || 'sandboxTokenizedAppKey5678',
    appSecret: process.env.BKASH_APP_SECRET || 'sandboxTokenizedAppSecretSecretKey9999',
    username: process.env.BKASH_USERNAME || 'sandboxTokenizedUser',
    password: process.env.BKASH_PASSWORD || 'sandboxTokenizedPassword1234',
    baseUrl: process.env.BKASH_BASE_URL || 'https://checkout.sandbox.bka.sh/v1.2.0-beta',
  }
};
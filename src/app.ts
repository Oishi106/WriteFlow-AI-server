import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import itemRoutes from './routes/item.routes';
import reviewRoutes from './modules/reviews/review.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import aiRoutes from './routes/ai.routes';
import documentRoutes from './routes/document.routes';
import bkashRoutes from './routes/bkash.routes'; 

const app: Application = express();

// ─── Security & CORS Middleware ───────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin: config.frontendUrl || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.options('*', cors());

// Rate limiting setup templates configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // Safe test threshold optimization mapping count values updated
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,
  message: { success: false, message: 'AI rate limit exceeded. Please wait a moment.' },
});

// ─── Body Parsing & Data Formatting ──────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Global generic protection limiter setup apply safely AFTER body parser processing layers
app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'WriteFlow AI API is running safely',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── API Routes Execution Mapping ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);

// Explicit dynamic mount target routing space validation bypass checkpoint
app.use('/api/bkash', bkashRoutes); 

// ─── Error Handling ────────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);
                    

export default app;
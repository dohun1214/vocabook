import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import wordbookRoutes from './routes/wordbook.routes';
import wordRoutes from './routes/word.routes';
import ocrRoutes from './routes/ocr.routes';
import ttsRoutes from './routes/tts.routes';
import statsRoutes from './routes/stats.routes';

import { authenticate } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/wordbooks', authenticate, wordbookRoutes);
app.use('/words', authenticate, wordRoutes);
app.use('/ocr', authenticate, ocrRoutes);
app.use('/tts', authenticate, ttsRoutes);
app.use('/stats', authenticate, statsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

export default app;

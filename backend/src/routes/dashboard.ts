import express from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const stats = {
    currentStreak: 5,
    longestStreak: 12,
    totalEntries: 30,
    averageMood: {
      thisWeek: 7.2,
      thisMonth: 6.8,
      lastMonth: 6.5,
    },
  };
  res.json({ success: true, data: stats });
}));

export default router;

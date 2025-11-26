import express from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  res.json({ success: true, data: user });
}));

export default router;
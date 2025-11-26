import express from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { notifications: [] } });
}));

export default router;

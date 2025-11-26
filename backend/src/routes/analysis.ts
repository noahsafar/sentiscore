import express from 'express';
import { body } from 'express-validator';
import { validate } from '@/middleware/validate';
import { analyzeMood } from '@/services/moodAnalysisService';
import { analyzeTrends } from '@/services/trendAnalysisService';
import { generateInsights } from '@/services/insightService';
import { asyncHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/analysis/mood:
 *   post:
 *     summary: Analyze mood from text
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to analyze
 *                 minLength: 10
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     moodScores:
 *                       $ref: '#/components/schemas/MoodScores'
 *                     analysis:
 *                       $ref: '#/components/schemas/MoodAnalysis'
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/mood',
  authMiddleware,
  [
    body('text')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Text must be between 10 and 5000 characters'),
  ],
  validate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { text } = req.body;

    const result = await analyzeMood(text);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/analysis/trends:
 *   get:
 *     summary: Get mood trends for the user
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [stress, happiness, clarity, energy, emotionalStability, overall]
 *           default: [overall]
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           score:
 *                             type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         average:
 *                           type: number
 *                         trend:
 *                           type: string
 *                           enum: [improving, declining, stable]
 *                         changePercent:
 *                           type: number
 */
router.get(
  '/trends',
  authMiddleware,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const timeRange = (req.query.timeRange as string) || 'month';
    const metrics = (req.query.metrics as string[]) || ['overall'];

    const trends = await analyzeTrends(userId, {
      timeRange,
      metrics,
    });

    res.json({
      success: true,
      data: trends,
    });
  })
);

/**
 * @swagger
 * /api/analysis/insights/generate:
 *   post:
 *     summary: Generate new insights for the user
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Insight'
 *                     count:
 *                       type: number
 */
router.post(
  '/insights/generate',
  authMiddleware,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;

    const insights = await generateInsights(userId, {
      types: ['pattern', 'trend', 'anomaly', 'advice'],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        insights,
        count: insights.length,
      },
    });
  })
);

/**
 * @swagger
 * /api/analysis/compare:
 *   post:
 *     summary: Compare mood between different time periods
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period1:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date
 *                   end:
 *                     type: string
 *                     format: date
 *               period2:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date
 *                   end:
 *                     type: string
 *                     format: date
 *     responses:
 *       200:
 *         description: Comparison successful
 */
router.post(
  '/compare',
  authMiddleware,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const { period1, period2 } = req.body;

    // This would implement period comparison logic
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        comparison: {
          period1: {
            average: 7.2,
            trend: 'improving',
          },
          period2: {
            average: 6.8,
            trend: 'stable',
          },
          difference: 0.4,
          significant: false,
        },
      },
    });
  })
);

export default router;
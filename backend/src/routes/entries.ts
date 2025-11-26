import express from 'express';
import { body, query } from 'express-validator';
import { validate } from '@/middleware/validate';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/index';
import { analyzeMood } from '@/services/moodAnalysisService';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  },
});

/**
 * @swagger
 * /api/entries:
 *   get:
 *     summary: Get user's journal entries
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Entries retrieved successfully
 */
router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where: { userId },
        include: {
          moodScores: true,
          analysis: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where: { userId } }),
    ]);

    const formattedEntries = entries.map(entry => ({
      ...entry,
      tags: entry.tags.map(et => et.tag.name),
    }));

    res.json({
      success: true,
      data: {
        entries: formattedEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/entries:
 *   post:
 *     summary: Create a new journal entry
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - transcript
 *             properties:
 *               transcript:
 *                 type: string
 *               audio:
 *                 type: string
 *                 format: binary
 *               duration:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Entry created successfully
 */
router.post(
  '/',
  authMiddleware,
  upload.single('audio'),
  [
    body('transcript')
      .isLength({ min: 10 })
      .withMessage('Transcript must be at least 10 characters'),
    body('duration').optional().isInt(),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
  ],
  validate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const { transcript, duration, tags = [], isPublic = false } = req.body;

    // Analyze mood
    const analysisResult = await analyzeMood(transcript);

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        userId,
        date: new Date(),
        transcript,
        audioUrl: req.file ? `/uploads/${req.file.filename}` : null,
        audioPath: req.file?.path,
        duration: duration ? parseInt(duration) : null,
        isPublic,
        moodScores: {
          create: analysisResult.moodScores,
        },
        analysis: {
          create: {
            sentiment: analysisResult.analysis.sentiment,
            emotions: analysisResult.analysis.emotions,
            tone: analysisResult.analysis.tone,
            cognitive: analysisResult.analysis.cognitive,
            advice: analysisResult.analysis.advice,
            summary: analysisResult.analysis.summary,
            keywords: analysisResult.keywords,
            confidence: 0.85,
          },
        },
      },
      include: {
        moodScores: true,
        analysis: true,
      },
    });

    // Handle tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName.toLowerCase() },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName.toLowerCase() },
          });
        }

        await prisma.entryTag.create({
          data: {
            entryId: entry.id,
            tagId: tag.id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: entry,
    });
  })
);

/**
 * @swagger
 * /api/entries/{id}:
 *   get:
 *     summary: Get a specific entry
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry retrieved successfully
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const entry = await prisma.entry.findFirst({
      where: { id, userId },
      include: {
        moodScores: true,
        analysis: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Entry not found',
        },
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  })
);

/**
 * @swagger
 * /api/entries/{id}:
 *   delete:
 *     summary: Delete an entry
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const entry = await prisma.entry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Entry not found',
        },
      });
    }

    await prisma.entry.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        message: 'Entry deleted successfully',
      },
    });
  })
);

export default router;
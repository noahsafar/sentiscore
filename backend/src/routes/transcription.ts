import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '@/services/transcriptionService';
import { asyncHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp3',
      'audio/m4a',
      'audio/mp4',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  },
});

/**
 * @swagger
 * /api/transcribe:
 *   post:
 *     summary: Transcribe audio file to text
 *     tags: [Transcription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe
 *     responses:
 *       200:
 *         description: Transcription successful
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
 *                     text:
 *                       type: string
 *                       description: Transcribed text
 *                     confidence:
 *                       type: number
 *                       description: Confidence score (0-1)
 *                     duration:
 *                       type: number
 *                       description: Audio duration in seconds
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware,
  upload.single('audio'),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_AUDIO_FILE',
          message: 'No audio file provided',
        },
      });
    }

    try {
      const result = await transcribeAudio(req.file.buffer, {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TRANSCRIPTION_FAILED',
          message: error.message || 'Failed to transcribe audio',
        },
      });
    }
  })
);

/**
 * @swagger
 * /api/transcribe/supported-formats:
 *   get:
 *     summary: Get supported audio formats
 *     tags: [Transcription]
 *     responses:
 *       200:
 *         description: Supported formats
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
 *                     formats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     maxSize:
 *                       type: string
 *                     maxDuration:
 *                       type: integer
 */
router.get(
  '/supported-formats',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      data: {
        formats: ['webm', 'ogg', 'wav', 'mp3', 'm4a', 'mp4'],
        maxSize: '10MB',
        maxDuration: 300, // 5 minutes
      },
    });
  })
);

export default router;
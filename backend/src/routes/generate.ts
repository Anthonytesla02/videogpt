import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToJob } from '../app';
import { geminiService } from '../services/geminiService';
import { elevenLabsService } from '../services/elevenLabsService';
import { videoService } from '../services/videoService';
import { ensureDirectoriesExist } from '../utils/fileUtils';
import { GenerationRequest, GenerationResponse, ProgressUpdate } from '../../../shared/types';

const router = express.Router();

// Validation schema for generation request
const generationSchema = Joi.object({
  script: Joi.string().min(50).max(5000).required().messages({
    'string.min': 'Script must be at least 50 characters long',
    'string.max': 'Script cannot exceed 5000 characters',
    'any.required': 'Script is required'
  }),
  videoLength: Joi.number().integer().min(30).max(300).default(60),
  artStyle: Joi.string().valid('stickman-simple', 'stickman-detailed', 'cartoon', 'minimalist').default('stickman-simple'),
  voiceId: Joi.string().valid('rachel', 'adam', 'bella', 'sam').default('rachel'),
  backgroundMusic: Joi.string().valid('none', 'upbeat', 'calm', 'dramatic').default('none'),
  frameRate: Joi.number().integer().valid(24, 30).default(30)
});

// POST /api/generate - Start video generation
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    // Validate request body
    const { error, value } = generationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const generationRequest: GenerationRequest = value;

    // Generate unique job ID
    const jobId = uuidv4();

    // Calculate estimated time based on script length
    const scriptLines = generationRequest.script.split('\n').filter(line => line.trim().length > 0);
    const estimatedTime = Math.max(60, scriptLines.length * 15); // 15 seconds per line minimum

    // Return immediate response with job ID
    const response: GenerationResponse = {
      jobId,
      estimatedTime,
      message: 'Video generation started'
    };

    res.status(200).json(response);

    // Start async video generation process
    processVideoGeneration(jobId, generationRequest);

  } catch (error) {
    console.error('Generation request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video generation'
    });
  }
});

// GET /api/generate/:jobId/status - Get job status
router.get('/:jobId/status', (req: express.Request, res: express.Response) => {
  const { jobId } = req.params;

  // For now, return a simple response
  // In a real implementation, you'd store job status in a database or cache
  res.json({
    jobId,
    status: 'processing',
    message: 'Job is being processed'
  });
});

// Async video generation function
async function processVideoGeneration(jobId: string, request: GenerationRequest) {
  try {
    // Ensure upload directories exist
    ensureDirectoriesExist();

    // Split script into lines
    const scriptLines = request.script.split('\n').filter(line => line.trim().length > 0);
    const totalLines = scriptLines.length;

    // Step 1: Validating script (5%)
    await broadcastProgress(jobId, 5, 'Validating script', `Processing ${totalLines} lines`);

    // Validate script content
    if (scriptLines.length < 3) {
      throw new Error('Script must have at least 3 meaningful lines');
    }

    // Step 2: Generating images (30%)
    await broadcastProgress(jobId, 10, 'Generating images', `Starting image generation for ${totalLines} lines`);

    const imagePaths: string[] = [];
    for (let i = 0; i < scriptLines.length; i++) {
      const line = scriptLines[i].trim();
      if (line) {
        try {
          const imagePath = await geminiService.generateStickmanImage(line, request.settings.artStyle);
          imagePaths.push(imagePath);

          const progress = 10 + (i + 1) / scriptLines.length * 25; // 10% to 35%
          await broadcastProgress(jobId, Math.round(progress), 'Generating images', `Generated ${i + 1}/${totalLines} images`);
        } catch (error) {
          console.error(`Failed to generate image for line ${i + 1}:`, error);
          // Continue with other lines
        }
      }
    }

    if (imagePaths.length === 0) {
      throw new Error('Failed to generate any images');
    }

    // Step 3: Creating audio (30%)
    await broadcastProgress(jobId, 40, 'Creating audio', `Starting audio generation for ${totalLines} lines`);

    const audioSegments = await elevenLabsService.generateAudioForScript(scriptLines, request.settings.voiceId);

    await broadcastProgress(jobId, 65, 'Creating audio', `Generated audio for all ${totalLines} lines`);

    // Step 4: Processing video (30%)
    await broadcastProgress(jobId, 70, 'Processing video', 'Starting video assembly');

    const videoPath = await videoService.createVideo(
      imagePaths,
      audioSegments,
      request.settings,
      jobId,
      (progress: number) => {
        // Broadcast FFmpeg progress (70% to 95%)
        const overallProgress = 70 + progress * 0.25;
        broadcastProgress(jobId, Math.round(overallProgress), 'Processing video', `Rendering video: ${Math.round(progress)}%`);
      }
    );

    // Step 5: Finalizing video (5%)
    await broadcastProgress(jobId, 95, 'Finalizing video', 'Applying final touches');

    // Generate video URL
    const videoUrl = `/videos/${jobId}.mp4`;

    await broadcastProgress(jobId, 100, 'Completed', 'Video generation complete!', videoUrl);

    console.log(`✅ Video generation completed for job ${jobId}: ${videoPath}`);

  } catch (error) {
    console.error(`❌ Video generation failed for job ${jobId}:`, error);

    await broadcastProgress(jobId, 0, 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Helper function to broadcast progress updates
async function broadcastProgress(
  jobId: string,
  progress: number,
  currentStep: string,
  message?: string,
  videoUrl?: string,
  error?: string
) {
  const update: ProgressUpdate = {
    jobId,
    progress,
    currentStep,
    message,
    error
  };

  // Add video URL if completed
  if (videoUrl && progress === 100) {
    (update as any).videoUrl = videoUrl;
  }

  broadcastToJob(jobId, update);

  // Small delay to prevent overwhelming the client
  await new Promise(resolve => setTimeout(resolve, 100));
}

export default router;
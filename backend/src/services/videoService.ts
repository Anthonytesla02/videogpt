import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { AudioSegment, VideoSettings, VideoTiming } from '../types';

const execAsync = promisify(exec);

class VideoService {
  private ffmpegPath: string;

  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    // Set FFmpeg path if specified
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(this.ffmpegPath);
    }
  }

  /**
   * Create video from images and audio segments
   */
  async createVideo(
    imagePaths: string[],
    audioSegments: AudioSegment[],
    settings: VideoSettings,
    jobId: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    try {
      const outputDir = path.join(process.cwd(), 'videos');
      await fs.mkdir(outputDir, { recursive: true });

      const outputFilename = `${jobId}.mp4`;
      const outputPath = path.join(outputDir, outputFilename);

      console.log(`🎬 Starting video creation for job ${jobId}`);

      // Step 1: Calculate video timing
      const videoTiming = this.calculateVideoTiming(audioSegments, settings.frameRate);

      // Step 2: Create temporary files
      const tempDir = await this.createTempDirectory(jobId);
      const imageSequencePath = await this.createImageSequence(imagePaths, videoTiming, tempDir);
      const audioPath = await this.concatenateAudioSegments(audioSegments, tempDir);

      // Step 3: Create base video from images
      progressCallback?.(25);
      const tempVideoPath = await this.createVideoFromImages(imageSequencePath, settings, tempDir, progressCallback);

      // Step 4: Add audio to video
      progressCallback?.(75);
      let finalVideoPath = tempVideoPath;

      if (audioPath) {
        finalVideoPath = await this.addAudioToVideo(tempVideoPath, audioPath, settings.backgroundMusic, tempDir, progressCallback);
      }

      // Step 5: Move to final location
      await fs.rename(finalVideoPath, outputPath);

      // Step 6: Cleanup temporary files
      await this.cleanupTempDirectory(tempDir);

      console.log(`✅ Video creation completed: ${outputFilename}`);
      return outputPath;

    } catch (error) {
      console.error('❌ Video creation failed:', error);
      throw new Error(`Video creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate timing for each image based on audio durations
   */
  calculateVideoTiming(audioSegments: AudioSegment[], frameRate: number): VideoTiming[] {
    const timing: VideoTiming[] = [];

    audioSegments.forEach((segment, index) => {
      timing.push({
        imageIndex: index,
        startTime: segment.startTime,
        duration: segment.duration,
        audioSegment: segment
      });
    });

    return timing;
  }

  /**
   * Create image sequence with proper timing
   */
  private async createImageSequence(imagePaths: string[], videoTiming: VideoTiming[], tempDir: string): Promise<string> {
    console.log('📸 Creating image sequence...');

    const imageSequenceDir = path.join(tempDir, 'images');
    await fs.mkdir(imageSequenceDir, { recursive: true });

    // Create image sequence with proper frame counts
    let frameIndex = 0;

    for (let i = 0; i < videoTiming.length && i < imagePaths.length; i++) {
      const timing = videoTiming[i];
      const imagePath = imagePaths[i];
      const frameCount = Math.round(timing.duration * 30); // 30 fps for image sequence

      // Copy image for each frame
      for (let frame = 0; frame < frameCount; frame++) {
        const frameFilename = `frame_${frameIndex.toString().padStart(6, '0')}.png`;
        const framePath = path.join(imageSequenceDir, frameFilename);

        try {
          await fs.copyFile(imagePath, framePath);
        } catch (error) {
          console.error(`Failed to copy image frame ${frameIndex}:`, error);
          // Create a blank frame as fallback
          await this.createBlankFrame(framePath);
        }

        frameIndex++;
      }
    }

    return path.join(imageSequenceDir, 'frame_%06d.png');
  }

  /**
   * Concatenate audio segments
   */
  private async concatenateAudioSegments(audioSegments: AudioSegment[], tempDir: string): Promise<string> {
    if (audioSegments.length === 0) {
      return '';
    }

    console.log('🎵 Concatenating audio segments...');

    const audioDir = path.join(tempDir, 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    // Create list file for concatenation
    const listFilePath = path.join(audioDir, 'audio_list.txt');
    let listContent = '';

    for (let i = 0; i < audioSegments.length; i++) {
      const segment = audioSegments[i];
      const segmentPath = segment.filePath;
      const segmentFilename = `segment_${i.toString().padStart(3, '0')}.mp3`;
      const segmentTargetPath = path.join(audioDir, segmentFilename);

      try {
        await fs.copyFile(segmentPath, segmentTargetPath);
        listContent += `file '${segmentFilename}'\n`;
      } catch (error) {
        console.error(`Failed to copy audio segment ${i}:`, error);
      }
    }

    await fs.writeFile(listFilePath, listContent);

    // Concatenate audio files
    const outputPath = path.join(audioDir, 'concatenated_audio.mp3');

    try {
      await execAsync(`ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`);
      console.log('✅ Audio concatenation completed');
      return outputPath;
    } catch (error) {
      console.error('❌ Audio concatenation failed:', error);
      return '';
    }
  }

  /**
   * Create video from image sequence
   */
  private async createVideoFromImages(
    imageSequencePath: string,
    settings: VideoSettings,
    tempDir: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    console.log('🎥 Creating video from images...');

    const outputPath = path.join(tempDir, 'video_no_audio.mp4');
    const [width, height] = settings.resolution.split('x').map(Number);

    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(imageSequencePath)
        .inputFPS(settings.frameRate)
        .videoCodec('libx264')
        .size(`${width}xheight}`)
        .videoBitrate('2000k')
        .outputOptions(['-pix_fmt', 'yuv420p'])
        .outputFormat('mp4')
        .output(outputPath)
        .on('progress', (progress: any) => {
          const percent = Math.round(progress.percent || 0);
          progressCallback?.(25 + (percent * 0.5)); // 25% to 75%
        })
        .on('end', () => {
          console.log('✅ Video from images completed');
          resolve(outputPath);
        })
        .on('error', (error: any) => {
          console.error('❌ Video creation failed:', error);
          reject(error);
        });

      command.run();
    });
  }

  /**
   * Add audio to video
   */
  private async addAudioToVideo(
    videoPath: string,
    audioPath: string,
    backgroundMusic: string,
    tempDir: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    console.log('🔊 Adding audio to video...');

    const outputPath = path.join(tempDir, 'final_video.mp4');

    return new Promise(async (resolve, reject) => {
      try {
        const command = ffmpeg()
          .input(videoPath);

        // Add main audio
        command.input(audioPath);

        // Add background music if specified
        if (backgroundMusic !== 'none') {
          const musicPath = await this.getBackgroundMusic(backgroundMusic, tempDir);
          if (musicPath) {
            command.input(musicPath);
          }
        }

        // Build audio filter
        let audioFilter = '';
        if (backgroundMusic !== 'none') {
          audioFilter = '[1:a][2:a]amix=inputs=2:weights=1 0.3[a]';
          command.outputOptions(['-map', '0:v', '-map', '[a]']);
        } else {
          command.outputOptions(['-map', '0:v', '-map', '1:a']);
        }

        if (audioFilter) {
          command.outputOptions(['-filter_complex', audioFilter]);
        }

        command
          .audioCodec('aac')
          .audioBitrate('128k')
          .outputFormat('mp4')
          .output(outputPath)
          .on('progress', (progress) => {
            const percent = Math.round(progress.percent || 0);
            progressCallback?.(75 + (percent * 0.2)); // 75% to 95%
          })
          .on('end', () => {
            console.log('✅ Audio addition completed');
            progressCallback?.(95);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ Audio addition failed:', error);
            reject(error);
          });

        command.run();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get background music file
   */
  private async getBackgroundMusic(musicType: string, tempDir: string): Promise<string | null> {
    try {
      // For now, create a simple tone
      // In a real implementation, you'd have actual music files
      const musicPath = path.join(tempDir, 'background_music.mp3');

      await execAsync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=30" -c:a libmp3lame -q:a 9 "${musicPath}"`);

      return musicPath;
    } catch (error) {
      console.error('Failed to create background music:', error);
      return null;
    }
  }

  /**
   * Create temporary directory
   */
  private async createTempDirectory(jobId: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp', jobId);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * Create blank frame
   */
  private async createBlankFrame(framePath: string): Promise<void> {
    try {
      await execAsync(`ffmpeg -f lavfi -i color=color=white:size=1920x1080:duration=1 -frames:v 1 "${framePath}"`);
    } catch (error) {
      console.error('Failed to create blank frame:', error);
    }
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoPath: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_streams "${videoPath}"`);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpegAvailable(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      console.error('FFmpeg not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const videoService = new VideoService();
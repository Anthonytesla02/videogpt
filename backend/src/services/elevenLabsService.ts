import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { AudioSegment } from '../../../shared/types';

// Voice ID mappings for ElevenLabs
const VOICE_IDS = {
  rachel: '21m00Tcm4TlvDq8ikWAM',  // Friendly female voice
  adam: 'pNInz6obpgDQGcFmaJgB',    // Professional male voice
  bella: 'EXAVITQu4vr4xnSDxMaL',   // Warm female voice
  sam: 'YoZ06aMxZJJ28mfd3POQ'      // Casual male voice
};

class ElevenLabsService {
  private client: ElevenLabsClient;

  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY not found in environment variables');
    }

    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
  }

  /**
   * Generate audio for an entire script
   */
  async generateAudioForScript(scriptLines: string[], voiceId: string): Promise<AudioSegment[]> {
    const audioSegments: AudioSegment[] = [];
    let currentTime = 0;

    for (let i = 0; i < scriptLines.length; i++) {
      const line = scriptLines[i].trim();
      if (line) {
        try {
          const audioPath = await this.generateAudioForLine(line, voiceId);
          const duration = await this.getAudioDuration(audioPath);

          const segment: AudioSegment = {
            filePath: audioPath,
            duration,
            text: line,
            startTime: currentTime
          };

          audioSegments.push(segment);
          currentTime += duration;

          // Rate limiting: wait 500ms between requests to avoid rate limits
          await this.delay(500);
        } catch (error) {
          console.error(`Failed to generate audio for line ${i + 1}: "${line}"`, error);
          // Continue with other lines, but log the error
        }
      }
    }

    return audioSegments;
  }

  /**
   * Generate audio for a single script line
   */
  async generateAudioForLine(text: string, voiceId: string): Promise<string> {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceIdToUse = VOICE_IDS[voiceId as keyof typeof VOICE_IDS];
    if (!voiceIdToUse) {
      throw new Error(`Invalid voice ID: ${voiceId}`);
    }

    try {
      // Generate audio using ElevenLabs API
      const audio = await this.client.generate({
        voice: voiceIdToUse,
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `audio_${timestamp}_${Math.random().toString(36).substring(7)}.mp3`;
      const audioPath = path.join(process.cwd(), 'uploads', 'audio', filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      // Save audio file
      if (audio instanceof Uint8Array) {
        await fs.writeFile(audioPath, audio);
      } else {
        // Handle streaming response
        const chunks: Buffer[] = [];
        for await (const chunk of audio) {
          chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);
        await fs.writeFile(audioPath, audioBuffer);
      }

      console.log(`✅ Generated audio: ${filename} for text: "${text.substring(0, 50)}..."`);
      return audioPath;

    } catch (error: any) {
      console.error('❌ ElevenLabs API error:', error);

      // Handle specific error cases
      if (error.response?.status === 429) {
        throw new Error('ElevenLabs API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid text or voice settings for ElevenLabs API');
      } else if (error.response?.status === 401) {
        throw new Error('ElevenLabs API authentication failed. Check API key.');
      } else if (error.response?.status === 403) {
        throw new Error('ElevenLabs API access forbidden. Check subscription and API key.');
      }

      // For other errors, retry with exponential backoff
      return await this.retryWithBackoff(() => this.generateAudioForLine(text, voiceId), 3);
    }
  }

  /**
   * Get audio duration using ffprobe or fallback estimation
   */
  async getAudioDuration(audioPath: string): Promise<number> {
    try {
      // Try to use ffprobe if available
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`);
        const duration = parseFloat(stdout.trim());
        return isNaN(duration) ? this.estimateDuration(audioPath) : duration;
      } catch (ffprobeError) {
        // Fallback to file size estimation
        return this.estimateDuration(audioPath);
      }
    } catch (error) {
      console.warn('Could not determine audio duration, using estimation:', error);
      return this.estimateDuration(audioPath);
    }
  }

  /**
   * Estimate audio duration based on file size and text length
   */
  private estimateDuration(audioPath: string): number {
    // Rough estimation: average speech rate is 150 words per minute
    // MP3 audio is roughly 1MB per minute at 128kbps
    try {
      const stats = require('fs').statSync(audioPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      return Math.max(1, fileSizeMB * 60); // At least 1 second
    } catch (error) {
      return 3; // Default to 3 seconds if we can't determine
    }
  }

  /**
   * Retry function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        console.log(`Retrying ElevenLabs API call (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
        await this.delay(delay);
        delay *= 2; // Exponential backoff
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a fallback audio file if generation fails
   */
  async createSilentAudio(duration: number): Promise<string> {
    const timestamp = Date.now();
    const filename = `silent_${timestamp}_${Math.random().toString(36).substring(7)}.mp3`;
    const audioPath = path.join(process.cwd(), 'uploads', 'audio', filename);

    try {
      // Try to create silent audio using ffmpeg
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      await execAsync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} -c:a libmp3lame -q:a 9 "${audioPath}"`);

      console.log(`✅ Created silent audio: ${filename} (${duration}s)`);
      return audioPath;
    } catch (error) {
      console.warn('Could not create silent audio with ffmpeg, creating empty file:', error);

      // Create empty file as fallback
      await fs.mkdir(path.dirname(audioPath), { recursive: true });
      await fs.writeFile(audioPath, Buffer.alloc(0));

      console.log(`✅ Created empty audio file: ${filename}`);
      return audioPath;
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      const voices = await this.client.voices.getAll();
      return voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();
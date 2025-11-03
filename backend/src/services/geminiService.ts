import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { ArtStyle } from '../types';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Style-specific prompts for different art styles
const stylePrompts = {
  'stickman-simple': 'Create a simple stickman illustration with clean black lines on white background. Minimal details, basic shapes only.',
  'stickman-detailed': 'Create a detailed stickman illustration with expressive poses and some additional details. Black lines on white background with moderate complexity.',
  'cartoon': 'Create a cartoon-style illustration with bold outlines and simple shapes. Friendly and colorful style.',
  'minimalist': 'Create a minimalist illustration using simple geometric shapes and clean lines. Modern and elegant design.'
};

class GeminiService {
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    }
    // Use the image generation model
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp-image-generation' });
  }

  /**
   * Generate stickman images for an entire script
   */
  async generateImagesForScript(scriptLines: string[], artStyle: ArtStyle): Promise<string[]> {
    const imagePaths: string[] = [];

    for (let i = 0; i < scriptLines.length; i++) {
      const line = scriptLines[i].trim();
      if (line) {
        try {
          const imagePath = await this.generateStickmanImage(line, artStyle);
          imagePaths.push(imagePath);

          // Rate limiting: wait 1 second between requests
          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to generate image for line ${i + 1}: "${line}"`, error);
          // Continue with other lines, but log the error
        }
      }
    }

    return imagePaths;
  }

  /**
   * Generate a single stickman image for a given script line
   */
  async generateStickmanImage(prompt: string, artStyle: ArtStyle): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Create the full prompt with style instructions
      const fullPrompt = `${stylePrompts[artStyle]}\n\nScene: ${prompt}\n\nCreate a single, clear illustration that represents this scene.`;

      // Generate content with image
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;

      // Check if the response contains an image
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = candidates[0];
      const content = candidate.content;

      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('No content parts returned from Gemini API');
      }

      // Find the image part
      const imagePart = content.parts.find((part: any) => part.inline_data);
      if (!imagePart || !imagePart.inline_data) {
        throw new Error('No image data found in Gemini response');
      }

      // Get image data (base64)
      const imageData = imagePart.inline_data.data;
      const mimeType = imagePart.inline_data.mime_type || 'image/png';

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `stickman_${timestamp}_${Math.random().toString(36).substring(7)}.png`;
      const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(imagePath), { recursive: true });

      // Save image file
      await fs.writeFile(imagePath, imageBuffer);

      console.log(`✅ Generated stickman image: ${filename}`);
      return imagePath;

    } catch (error: any) {
      console.error('❌ Gemini API error:', error);

      // Handle specific error cases
      if (error.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else if (error.status === 400) {
        throw new Error('Invalid prompt for Gemini API');
      } else if (error.status === 403) {
        throw new Error('Gemini API access forbidden. Check API key.');
      }

      // For other errors, retry with exponential backoff
      return await this.retryWithBackoff(() => this.generateStickmanImage(prompt, artStyle), 3);
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

        console.log(`Retrying Gemini API call (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
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
   * Create a placeholder image if generation fails
   */
  async createPlaceholderImage(text: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `placeholder_${timestamp}_${Math.random().toString(36).substring(7)}.png`;
    const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);

    // For now, create a simple 1x1 pixel transparent PNG
    // In a real implementation, you might want to create a proper placeholder image
    const placeholderBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, compression, filter, interlace
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // image data
      0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // CRC
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82 // CRC
    ]);

    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, placeholderBuffer);

    console.log(`✅ Created placeholder image: ${filename}`);
    return imagePath;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
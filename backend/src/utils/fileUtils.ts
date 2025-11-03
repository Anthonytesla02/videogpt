import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export function ensureDirectoriesExist(): void {
  const directories = [
    'uploads',
    'uploads/images',
    'uploads/audio',
    'videos',
    'temp'
  ];

  directories.forEach(async (dir) => {
    try {
      const fullPath = path.join(process.cwd(), dir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✅ Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error);
    }
  });
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);

  return `${nameWithoutExt}_${timestamp}_${uniqueId}${extension}`;
}

export async function cleanupOldFiles(maxAge: number): Promise<number> {
  const directories = ['uploads/images', 'uploads/audio', 'videos', 'temp'];
  let deletedCount = 0;

  const now = Date.now();

  for (const dir of directories) {
    try {
      const fullPath = path.join(process.cwd(), dir);
      const files = await fs.readdir(fullPath);

      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old file: ${file} (${Math.round(fileAge / 1000 / 60)} minutes old)`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup directory ${dir}:`, error);
    }
  }

  if (deletedCount > 0) {
    console.log(`🧹 Cleanup completed: Deleted ${deletedCount} old files`);
  }

  return deletedCount;
}

export async function validateImageFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);

    // Check file size (should be between 1KB and 10MB)
    const fileSize = stats.size;
    if (fileSize < 1024 || fileSize > 10 * 1024 * 1024) {
      console.warn(`Invalid image file size: ${fileSize} bytes for ${filePath}`);
      return false;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!validExtensions.includes(ext)) {
      console.warn(`Invalid image file extension: ${ext} for ${filePath}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating image file ${filePath}:`, error);
    return false;
  }
}

export async function validateAudioFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);

    // Check file size (should be between 1KB and 50MB)
    const fileSize = stats.size;
    if (fileSize < 1024 || fileSize > 50 * 1024 * 1024) {
      console.warn(`Invalid audio file size: ${fileSize} bytes for ${filePath}`);
      return false;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
    if (!validExtensions.includes(ext)) {
      console.warn(`Invalid audio file extension: ${ext} for ${filePath}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating audio file ${filePath}:`, error);
    return false;
  }
}

export async function validateVideoFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);

    // Check file size (should be between 1KB and 500MB)
    const fileSize = stats.size;
    if (fileSize < 1024 || fileSize > 500 * 1024 * 1024) {
      console.warn(`Invalid video file size: ${fileSize} bytes for ${filePath}`);
      return false;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
    if (!validExtensions.includes(ext)) {
      console.warn(`Invalid video file extension: ${ext} for ${filePath}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating video file ${filePath}:`, error);
    return false;
  }
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getFileType(filename: string): 'image' | 'audio' | 'video' | 'unknown' {
  const ext = path.extname(filename).toLowerCase();

  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    return 'image';
  } else if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(ext)) {
    return 'audio';
  } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
    return 'video';
  }

  return 'unknown';
}

export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error getting directory size for ${dirPath}:`, error);
  }

  return totalSize;
}

export async function ensureDiskSpace(requiredBytes: number): Promise<boolean> {
  try {
    // Get current directory size
    const uploadsSize = await getDirectorySize(path.join(process.cwd(), 'uploads'));
    const videosSize = await getDirectorySize(path.join(process.cwd(), 'videos'));
    const currentSize = uploadsSize + videosSize;

    // Estimate available space (this is a rough estimate)
    // In a real implementation, you'd use a proper disk space check
    const estimatedMaxSpace = 10 * 1024 * 1024 * 1024; // 10GB
    const availableSpace = estimatedMaxSpace - currentSize;

    return availableSpace > requiredBytes;
  } catch (error) {
    console.error('Error checking disk space:', error);
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run cleanup periodically
export function startPeriodicCleanup(): void {
  const maxAge = parseInt(process.env.MAX_FILE_AGE || '86400000'); // 24 hours default
  const cleanupInterval = 60 * 60 * 1000; // Run every hour

  // Run initial cleanup
  cleanupOldFiles(maxAge);

  // Schedule periodic cleanup
  setInterval(() => {
    cleanupOldFiles(maxAge);
  }, cleanupInterval);

  console.log(`🔄 Periodic cleanup started (max age: ${Math.round(maxAge / 1000 / 60)} minutes)`);
}
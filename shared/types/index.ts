export interface VideoSettings {
  videoLength: number;
  artStyle: ArtStyle;
  voiceId: string;
  backgroundMusic: BackgroundMusic;
  frameRate: number;
  resolution: '1920x1080' | '1280x720';
}

export interface GenerationRequest {
  script: string;
  settings: VideoSettings;
}

export interface GenerationResponse {
  jobId: string;
  estimatedTime: number;
  message: string;
}

export interface AudioSegment {
  filePath: string;
  duration: number;
  text: string;
  startTime: number;
}

export interface VideoStatusResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  videoUrl?: string;
  error?: string;
}

export type ArtStyle = 'stickman-simple' | 'stickman-detailed' | 'cartoon' | 'minimalist';
export type BackgroundMusic = 'none' | 'upbeat' | 'calm' | 'dramatic';

export interface ProgressUpdate {
  jobId: string;
  progress: number;
  currentStep: string;
  message?: string;
  error?: string;
}

export interface VideoTiming {
  imageIndex: number;
  startTime: number;
  duration: number;
  audioSegment: AudioSegment;
}
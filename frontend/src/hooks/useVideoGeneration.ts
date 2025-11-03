import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoSettings, ProgressUpdate } from '../types';
import { api } from '../services/api';

interface UseVideoGenerationReturn {
  generateVideo: (script: string, settings: VideoSettings) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  videoUrl: string | null;
  cancelGeneration: () => void;
}

const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = useCallback((jobId: string) => {
    const wsUrl = `ws://localhost:3001`;

    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for job:', jobId);

        // Subscribe to job updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          jobId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: ProgressUpdate = JSON.parse(event.data);

          if (data.jobId === jobId) {
            setProgress(data.progress);
            setCurrentStep(data.currentStep);

            if (data.error) {
              setError(data.error);
              setIsGenerating(false);
            }

            if (data.progress === 100 && (data as any).videoUrl) {
              setVideoUrl((data as any).videoUrl);
              setIsGenerating(false);
              console.log('✅ Video generation completed:', (data as any).videoUrl);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setIsGenerating(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected for job:', jobId);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to establish real-time connection. Please refresh the page.');
      setIsGenerating(false);
    }
  }, []);

  const generateVideo = useCallback(async (script: string, settings: VideoSettings) => {
    try {
      // Reset state
      setIsGenerating(true);
      setProgress(0);
      setCurrentStep('Initializing...');
      setError(null);
      setVideoUrl(null);

      // Start video generation
      const response = await api.generate({
        script,
        settings
      });

      jobIdRef.current = response.jobId;
      console.log('🚀 Video generation started:', response.jobId);

      // Connect WebSocket for real-time updates
      connectWebSocket(response.jobId);

      // Set initial progress
      setProgress(1);
      setCurrentStep('Generation started...');

    } catch (error) {
      console.error('Video generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to start video generation');
      setIsGenerating(false);
    }
  }, [connectWebSocket]);

  const cancelGeneration = useCallback(() => {
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Reset state
    setIsGenerating(false);
    setProgress(0);
    setCurrentStep('');
    setError('Generation cancelled');
    jobIdRef.current = null;

    console.log('❌ Video generation cancelled');
  }, []);

  return {
    generateVideo,
    isGenerating,
    progress,
    currentStep,
    error,
    videoUrl,
    cancelGeneration
  };
};

export default useVideoGeneration;
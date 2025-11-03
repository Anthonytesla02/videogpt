import axios, { AxiosInstance, AxiosError } from 'axios';
import { GenerationRequest, GenerationResponse, VideoStatusResponse } from '../types';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error: AxiosError) => {
    console.error('❌ API Response Error:', error);

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = (error.response.data as any)?.error || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 429:
          throw new Error(`Rate limit exceeded: ${message}. Please try again later.`);
        case 500:
          throw new Error(`Server error: ${message}. Please try again later.`);
        default:
          throw new Error(`Request failed: ${message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    } else {
      // Something else happened
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
);

// API endpoints
export const api = {
  /**
   * Start video generation
   */
  generate: async (data: GenerationRequest): Promise<GenerationResponse> => {
    return await apiClient.post('/generate', data);
  },

  /**
   * Get video generation status
   */
  getVideoStatus: async (jobId: string): Promise<VideoStatusResponse> => {
    return await apiClient.get(`/generate/${jobId}/status`);
  },

  /**
   * Download video file
   */
  downloadVideo: async (videoId: string): Promise<Blob> => {
    const response = await axios.get(`/videos/${videoId}.mp4`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Share video (generate shareable link)
   */
  shareVideo: async (videoId: string): Promise<{ shareUrl: string }> => {
    return await apiClient.post(`/videos/${videoId}/share`);
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    return await apiClient.get('/health');
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error: any): string => {
  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Export the axios instance for custom requests if needed
export default apiClient;
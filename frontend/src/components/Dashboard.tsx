import React, { useState } from 'react';
import ScriptInput from './ScriptInput';
import VideoSettings from './VideoSettings';
import ProgressBar from './ProgressBar';
import VideoPreview from './VideoPreview';
import useVideoGeneration from '../hooks/useVideoGeneration';
import { VideoSettings as IVideoSettings } from '../types';

const Dashboard: React.FC = () => {
  const [script, setScript] = useState('');
  const [settings, setSettings] = useState<IVideoSettings>({
    videoLength: 60,
    artStyle: 'stickman-simple',
    voiceId: 'rachel',
    backgroundMusic: 'none',
    frameRate: 30,
    resolution: '1920x1080'
  });

  const {
    generateVideo,
    isGenerating,
    progress,
    currentStep,
    error,
    videoUrl,
    cancelGeneration
  } = useVideoGeneration();

  const handleGenerate = async () => {
    if (!script.trim()) {
      alert('Please enter a script before generating a video.');
      return;
    }

    try {
      await generateVideo(script, settings);
    } catch (error) {
      console.error('Video generation failed:', error);
    }
  };

  const handleReset = () => {
    setScript('');
    setSettings({
      videoLength: 60,
      artStyle: 'stickman-simple',
      voiceId: 'rachel',
      backgroundMusic: 'none',
      frameRate: 30,
      resolution: '1920x1080'
    });
  };

  return (
    <div className="dashboard">
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left Column - Input */}
        <div>
          <ScriptInput
            value={script}
            onChange={setScript}
            disabled={isGenerating}
          />
        </div>

        {/* Right Column - Settings */}
        <div>
          <VideoSettings
            settings={settings}
            onChange={setSettings}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        {!isGenerating && !videoUrl && (
          <button
            className="button button-primary"
            onClick={handleGenerate}
            disabled={!script.trim() || script.length < 50}
            style={{
              fontSize: '1.125rem',
              padding: '1rem 2rem',
              minWidth: '200px'
            }}
          >
            🎬 Generate Video
          </button>
        )}

        {isGenerating && (
          <button
            className="button button-secondary"
            onClick={cancelGeneration}
            style={{
              fontSize: '1rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            ❌ Cancel Generation
          </button>
        )}

        {videoUrl && !isGenerating && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
            <button
              className="button button-primary"
              onClick={handleReset}
              style={{
                fontSize: '1rem',
                padding: '0.75rem 1.5rem'
              }}
            >
              🔄 Create New Video
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <ProgressBar
          progress={progress}
          currentStep={currentStep}
          error={error}
        />
      )}

      {/* Error Display */}
      {error && !isGenerating && (
        <div className="card" style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          margin: '1rem 0'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>
            ❌ Generation Failed
          </h3>
          <p style={{ color: '#dc2626', margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Video Preview */}
      {videoUrl && (
        <VideoPreview
          videoUrl={videoUrl}
          script={script}
          settings={settings}
        />
      )}

      {/* Instructions */}
      {!isGenerating && !videoUrl && (
        <div className="card" style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          marginTop: '2rem'
        }}>
          <h3 style={{ color: '#0369a1', margin: '0 0 1rem 0' }}>
            📖 How to Use
          </h3>
          <ol style={{ color: '#0c4a6e', margin: 0, paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Write your script (minimum 50 characters)</li>
            <li style={{ marginBottom: '0.5rem' }}>Choose your preferred art style and voice</li>
            <li style={{ marginBottom: '0.5rem' }}>Click "Generate Video" to create your animated stickman video</li>
            <li style={{ marginBottom: '0.5rem' }}>Wait for AI to generate images and audio</li>
            <li>Preview and download your completed video</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
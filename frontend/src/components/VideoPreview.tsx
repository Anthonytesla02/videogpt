import React, { useState, useRef } from 'react';
import type { VideoSettings } from '../types';

interface VideoPreviewProps {
  videoUrl: string;
  script: string;
  settings: VideoSettings;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, script, settings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AI Generated Video',
          text: 'Check out this video I created with AI!',
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Video link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScriptLines = () => {
    return script.split('\n').filter(line => line.trim().length > 0);
  };

  return (
    <div className="card">
      <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
        🎥 Your Generated Video
      </h2>

      {/* Video Player */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '500px',
            display: 'block'
          }}
          controls={false}
        />

        {/* Custom Controls */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '1rem',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: showControls ? 'auto' : 'none'
          }}
        >
          {/* Progress Bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                background: '#333',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'white',
              marginTop: '0.25rem'
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={handlePlayPause}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '60px',
                  height: '4px',
                  borderRadius: '2px',
                  background: '#333',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            <button
              onClick={handleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginLeft: 'auto'
              }}
            >
              {isFullscreen ? '🔲' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleDownload}
          className="button button-primary"
          style={{
            fontSize: '1rem',
            padding: '0.75rem 1.5rem'
          }}
        >
          📥 Download Video
        </button>

        <button
          onClick={handleShare}
          className="button button-secondary"
          style={{
            fontSize: '1rem',
            padding: '0.75rem 1.5rem'
          }}
        >
          📤 Share
        </button>
      </div>

      {/* Video Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            📝 Script Details
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div>Lines: {getScriptLines().length}</div>
            <div>Characters: {script.length}</div>
            <div>Words: {script.split(/\s+/).filter(word => word.length > 0).length}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            ⚙️ Settings Used
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div>Style: {settings.artStyle}</div>
            <div>Voice: {settings.voiceId}</div>
            <div>Music: {settings.backgroundMusic}</div>
            <div>Quality: {settings.resolution}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            📊 Video Info
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div>Duration: {formatTime(duration)}</div>
            <div>Frame Rate: {settings.frameRate} fps</div>
            <div>Created: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Script Preview */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          📖 Script Preview
        </h4>
        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {getScriptLines().map((line, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <strong>Scene {index + 1}:</strong> {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
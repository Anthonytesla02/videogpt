import React from 'react';
import { VideoSettings } from '../../shared/types';

interface VideoSettingsProps {
  settings: VideoSettings;
  onChange: (settings: VideoSettings) => void;
  disabled?: boolean;
}

const VideoSettings: React.FC<VideoSettingsProps> = ({ settings, onChange, disabled = false }) => {
  const handleSettingChange = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const artStyles = [
    { value: 'stickman-simple', label: 'Simple Stickman', description: 'Clean, basic stick figures' },
    { value: 'stickman-detailed', label: 'Detailed Stickman', description: 'More expressive stick figures' },
    { value: 'cartoon', label: 'Cartoon Style', description: 'Colorful cartoon illustrations' },
    { value: 'minimalist', label: 'Minimalist', description: 'Simple geometric shapes' }
  ];

  const voiceOptions = [
    { value: 'rachel', label: 'Rachel', description: 'Friendly female voice' },
    { value: 'adam', label: 'Adam', description: 'Professional male voice' },
    { value: 'bella', label: 'Bella', description: 'Warm female voice' },
    { value: 'sam', label: 'Sam', description: 'Casual male voice' }
  ];

  const backgroundMusicOptions = [
    { value: 'none', label: 'No Music', description: 'Voice only' },
    { value: 'upbeat', label: 'Upbeat', description: 'Energetic background music' },
    { value: 'calm', label: 'Calm', description: 'Peaceful background music' },
    { value: 'dramatic', label: 'Dramatic', description: 'Intense background music' }
  ];

  const resolutions = [
    { value: '1920x1080', label: 'Full HD (1080p)', description: 'Best quality, larger file' },
    { value: '1280x720', label: 'HD (720p)', description: 'Good quality, smaller file' }
  ];

  const frameRates = [
    { value: 24, label: '24 fps', description: 'Cinematic look' },
    { value: 30, label: '30 fps', description: 'Standard video' }
  ];

  return (
    <div className="card">
      <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
        ⚙️ Video Settings
      </h2>

      {/* Art Style */}
      <div className="form-group">
        <label className="form-label">
          🎨 Art Style
        </label>
        <div className="radio-group">
          {artStyles.map((style) => (
            <label
              key={style.value}
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                padding: '1rem',
                border: `2px solid ${settings.artStyle === style.value ? 'var(--primary-color)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: settings.artStyle === style.value ? '#f0f9ff' : 'white',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="artStyle"
                  value={style.value}
                  checked={settings.artStyle === style.value}
                  onChange={() => handleSettingChange('artStyle', style.value as any)}
                  disabled={disabled}
                  style={{ marginRight: '0.75rem' }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {style.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {style.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div className="form-group">
        <label className="form-label">
          🎤 Voice
        </label>
        <div className="radio-group">
          {voiceOptions.map((voice) => (
            <label
              key={voice.value}
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                padding: '1rem',
                border: `2px solid ${settings.voiceId === voice.value ? 'var(--primary-color)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: settings.voiceId === voice.value ? '#f0f9ff' : 'white',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="voiceId"
                  value={voice.value}
                  checked={settings.voiceId === voice.value}
                  onChange={() => handleSettingChange('voiceId', voice.value)}
                  disabled={disabled}
                  style={{ marginRight: '0.75rem' }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {voice.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {voice.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Background Music */}
      <div className="form-group">
        <label className="form-label">
          🎵 Background Music
        </label>
        <select
          value={settings.backgroundMusic}
          onChange={(e) => handleSettingChange('backgroundMusic', e.target.value as any)}
          disabled={disabled}
          className="input"
          style={{ opacity: disabled ? 0.6 : 1 }}
        >
          {backgroundMusicOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="form-help">
          {backgroundMusicOptions.find(opt => opt.value === settings.backgroundMusic)?.description}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="form-group">
        <label className="form-label">
          🔧 Advanced Settings
        </label>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Resolution */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Resolution
            </label>
            <select
              value={settings.resolution}
              onChange={(e) => handleSettingChange('resolution', e.target.value as any)}
              disabled={disabled}
              className="input"
              style={{ opacity: disabled ? 0.6 : 1 }}
            >
              {resolutions.map((resolution) => (
                <option key={resolution.value} value={resolution.value}>
                  {resolution.label}
                </option>
              ))}
            </select>
            <div className="form-help">
              {resolutions.find(opt => opt.value === settings.resolution)?.description}
            </div>
          </div>

          {/* Frame Rate */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Frame Rate
            </label>
            <select
              value={settings.frameRate}
              onChange={(e) => handleSettingChange('frameRate', parseInt(e.target.value))}
              disabled={disabled}
              className="input"
              style={{ opacity: disabled ? 0.6 : 1 }}
            >
              {frameRates.map((framerate) => (
                <option key={framerate.value} value={framerate.value}>
                  {framerate.label}
                </option>
              ))}
            </select>
            <div className="form-help">
              {frameRates.find(opt => opt.value === settings.frameRate)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Estimated Settings Summary */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          📊 Settings Summary
        </div>
        <div>Style: {artStyles.find(s => s.value === settings.artStyle)?.label}</div>
        <div>Voice: {voiceOptions.find(v => v.value === settings.voiceId)?.label}</div>
        <div>Music: {backgroundMusicOptions.find(m => m.value === settings.backgroundMusic)?.label}</div>
        <div>Quality: {settings.resolution} at {settings.frameRate} fps</div>
      </div>
    </div>
  );
};

export default VideoSettings;
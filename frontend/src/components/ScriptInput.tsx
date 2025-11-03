import React, { useState, useEffect } from 'react';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ value, onChange, disabled = false }) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    const lines = value.split('\n').filter(line => line.trim().length > 0);

    setWordCount(words.length);
    setCharCount(value.length);
    setLineCount(lines.length);

    // Validation: at least 50 characters and 3 lines
    const valid = value.length >= 50 && lines.length >= 3;
    setIsValid(valid);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Enforce maximum character limit
    if (newValue.length <= 5000) {
      onChange(newValue);
    }
  };

  const loadSampleScript = () => {
    const sampleScript = `Once upon a time, in a land far, far away, there lived a curious little stick figure.

This stick figure loved to explore and discover new things every single day.

One morning, our hero decided to embark on the greatest adventure of their life.

With a spring in their step and hope in their heart, they journeyed into the unknown.

What wonders and challenges awaited our brave little explorer?`;

    onChange(sampleScript);
  };

  const clearScript = () => {
    onChange('');
  };

  return (
    <div className="card">
      <div className="form-group">
        <label className="form-label">
          📝 Your Script
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={loadSampleScript}
            disabled={disabled}
            className="button button-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            📋 Load Sample
          </button>

          <button
            type="button"
            onClick={clearScript}
            disabled={disabled}
            className="button button-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            🗑️ Clear
          </button>
        </div>

        <textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="textarea"
          placeholder="Enter your script here. Each line will become a scene in your video.

Example:
The sun rises over the peaceful town.
Our hero wakes up with a stretch.
Today is going to be an adventure!
They pack their bag and head outside..."
          style={{
            minHeight: '300px',
            fontSize: '1rem',
            lineHeight: '1.6',
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? '#f8fafc' : 'white'
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <span>{charCount} / 5000 characters</span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>{wordCount} words</span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>{lineCount} lines</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {!isValid && value.length > 0 && (
              <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
                ⚠️ Minimum 50 characters and 3 lines required
              </span>
            )}

            {isValid && (
              <span style={{ color: 'var(--success-color)' }}>
                ✅ Ready to generate
              </span>
            )}
          </div>
        </div>

        {!isValid && value.length > 0 && value.length < 50 && (
          <div className="error">
            Script must be at least 50 characters long. Current: {value.length} characters.
          </div>
        )}

        {!isValid && value.split('\n').filter(line => line.trim().length > 0).length < 3 && value.length >= 50 && (
          <div className="error">
            Script must have at least 3 meaningful lines. Current: {lineCount} lines.
          </div>
        )}

        <div className="form-help">
          💡 <strong>Tip:</strong> Each line of your script will become a separate scene in the video.
          Keep lines concise and descriptive for best results.
        </div>
      </div>
    </div>
  );
};

export default ScriptInput;
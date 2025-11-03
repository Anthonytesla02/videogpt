import React from 'react';

interface ProgressBarProps {
  progress: number;
  currentStep: string;
  error?: string | null;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, currentStep, error }) => {
  const getProgressColor = () => {
    if (error) return 'var(--error-color)';
    if (progress === 100) return 'var(--success-color)';
    return 'var(--primary-color)';
  };

  const getProgressMessage = () => {
    if (error) return '❌ Generation Failed';
    if (progress === 100) return '✅ Generation Complete!';
    return '🔄 Generating Video...';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimate remaining time based on progress
  const getEstimatedTimeRemaining = () => {
    if (progress >= 95) return 'Almost done...';
    if (progress >= 70) return 'Processing video...';
    if (progress >= 40) return 'Creating audio...';
    if (progress >= 10) return 'Generating images...';
    return 'Starting generation...';
  };

  return (
    <div className="card" style={{
      backgroundColor: error ? '#fef2f2' : '#f0f9ff',
      border: `1px solid ${error ? '#fecaca' : '#bae6fd'}`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          backgroundColor: getProgressColor(),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          {error ? '!' : Math.round(progress)}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0',
            color: error ? 'var(--error-color)' : 'var(--text-primary)',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            {getProgressMessage()}
          </h3>
          <p style={{
            margin: '0.25rem 0 0 0',
            color: error ? 'var(--error-color)' : 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            {currentStep}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '0.75rem',
        backgroundColor: error ? '#fecaca' : '#e2e8f0',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: getProgressColor(),
            borderRadius: '0.375rem',
            transition: 'width 0.3s ease-in-out',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated shimmer effect */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: progress % 100 === 0 ? 'none' : 'shimmer 2s infinite'
            }}
          />
        </div>
      </div>

      {/* Progress Details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: error ? 'var(--error-color)' : 'var(--text-secondary)'
      }}>
        <div>
          {progress > 0 && (
            <span>{Math.round(progress)}% complete</span>
          )}
        </div>

        <div>
          {!error && progress < 100 && (
            <span>{getEstimatedTimeRemaining()}</span>
          )}
        </div>
      </div>

      {/* Step-by-step indicator */}
      {!error && (
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--text-primary)'
          }}>
            Generation Steps:
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { step: 'Validating', min: 0, max: 10 },
              { step: 'Images', min: 10, max: 40 },
              { step: 'Audio', min: 40, max: 70 },
              { step: 'Video', min: 70, max: 95 },
              { step: 'Complete', min: 95, max: 100 }
            ].map(({ step, min, max }) => {
              const isActive = progress >= min && progress < max;
              const isCompleted = progress >= max;

              return (
                <div
                  key={step}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: isCompleted
                      ? 'var(--success-color)'
                      : isActive
                      ? 'var(--primary-color)'
                      : '#e2e8f0',
                    color: isCompleted || isActive ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem'
        }}>
          <div style={{
            fontWeight: '600',
            color: 'var(--error-color)',
            marginBottom: '0.5rem'
          }}>
            Error Details:
          </div>
          <div style={{
            color: 'var(--error-color)',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
import React from 'react';

interface RiskScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const RiskScoreRing: React.FC<RiskScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#12B76A'; // Low Risk
  let bandLabel = 'LOW RISK';
  let bandBg = '#ECFDF3';
  let bandText = '#027A48';

  if (clampedScore >= 75) {
    strokeColor = '#D92D20'; // Critical Risk
    bandLabel = 'CRITICAL';
    bandBg = '#FEE4E2';
    bandText = '#912018';
  } else if (clampedScore >= 50) {
    strokeColor = '#F04438'; // High Risk
    bandLabel = 'HIGH RISK';
    bandBg = '#FEF3F2';
    bandText = '#B42318';
  } else if (clampedScore >= 25) {
    strokeColor = '#F79009'; // Moderate Risk
    bandLabel = 'MODERATE';
    bandBg = '#FFFAEB';
    bandText = '#B54708';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAECF0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>

      {/* Center Score & Label */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: size >= 100 ? '1.75rem' : '1.25rem',
            fontWeight: 800,
            color: '#0B1F3A',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {clampedScore}
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#667085', marginTop: '2px' }}>
          / 100
        </span>
        {showLabel && size >= 120 && (
          <span
            style={{
              marginTop: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontWeight: 700,
              backgroundColor: bandBg,
              color: bandText,
              letterSpacing: '0.04em',
            }}
          >
            {bandLabel}
          </span>
        )}
      </div>
    </div>
  );
};

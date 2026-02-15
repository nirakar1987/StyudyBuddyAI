import React from 'react';

interface ScoreRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ percentage, size = 60, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let color = 'var(--color-danger)';
  if (percentage >= 80) {
    color = 'var(--color-success)';
  } else if (percentage >= 50) {
    color = 'var(--color-accent)';
  }

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          stroke="var(--color-surface-lighter)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s',
          }}
        />
      </svg>
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{`${Math.round(percentage)}%`}</span>
    </div>
  );
};

export default ScoreRing;
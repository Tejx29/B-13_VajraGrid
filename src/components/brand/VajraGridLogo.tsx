import React from 'react';

export interface VajraGridLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  size?: number | string;
  height?: number | string;
  width?: number | string;
  'aria-label'?: string;
}

export const VajraGridLogo: React.FC<VajraGridLogoProps> = ({
  variant = 'full',
  className = '',
  size,
  height,
  width,
  'aria-label': ariaLabel = 'VajraGrid'
}) => {
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        fill="none"
        aria-label={ariaLabel}
        role="img"
        preserveAspectRatio="xMidYMid meet"
        className={`shrink-0 ${className}`}
        style={{
          height: height || size || '100%',
          width: width || (height ? 'auto' : size || 'auto'),
          display: 'inline-block',
          verticalAlign: 'middle'
        }}
      >
        <defs>
          {/* Top Inverted Triangle Gradient */}
          <linearGradient id="vj-tri-grad-icon" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#D82618" />
            <stop offset="65%" stopColor="#EA4314" />
            <stop offset="100%" stopColor="#FA6507" />
          </linearGradient>

          {/* Left Red Wing Gradient */}
          <linearGradient id="vj-red-wing-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EB3E17" />
            <stop offset="50%" stopColor="#E3320E" />
            <stop offset="100%" stopColor="#DD2406" />
          </linearGradient>

          {/* Right Blue Wing Gradient */}
          <linearGradient id="vj-blue-wing-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E54E8" />
            <stop offset="60%" stopColor="#2449D8" />
            <stop offset="100%" stopColor="#1B3DC5" />
          </linearGradient>

          {/* Outer Blue Wings Gradient */}
          <linearGradient id="vj-blue-outer-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3259ED" />
            <stop offset="100%" stopColor="#1F42CE" />
          </linearGradient>

          {/* Seam Ambient Occlusion / Shadow */}
          <linearGradient id="vj-seam-shadow-icon" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#582307" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#3F1905" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2449D8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Left Outer Blue Stripe */}
        <polygon
          points="50,250 50,405 245,705 355,705 150,390 50,250"
          fill="url(#vj-blue-outer-icon)"
          stroke="#1C37B0"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 2. Right Outer Blue Stripe */}
        <polygon
          points="950,250 950,405 755,705 645,705 850,390 950,250"
          fill="url(#vj-blue-outer-icon)"
          stroke="#1C37B0"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 3. Top Center Inverted Triangle */}
        <polygon
          points="380,150 620,150 500,330"
          fill="url(#vj-tri-grad-icon)"
          stroke="#B81E12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* 4. Left Inner Red/Orange Main Chevron */}
        <polygon
          points="55,150 270,150 500,510 605,670 500,835"
          fill="url(#vj-red-wing-icon)"
          stroke="#BF1F07"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 5. Right Inner Blue Main Chevron */}
        <polygon
          points="730,150 945,150 605,670 500,510"
          fill="url(#vj-blue-wing-icon)"
          stroke="#1C37B0"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 6. Shadow / Bevel at Seam Overlap */}
        <polygon
          points="500,510 535,455 640,615 605,670"
          fill="url(#vj-seam-shadow-icon)"
        />
      </svg>
    );
  }

  // Full variant: Icon + Wordmark
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 740 200"
      fill="none"
      aria-label={ariaLabel}
      role="img"
      preserveAspectRatio="xMidYMid meet"
      className={`shrink-0 ${className}`}
      style={{
        height: height || size || '100%',
        width: width || (height ? 'auto' : size || 'auto'),
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      <defs>
        {/* Top Inverted Triangle Gradient */}
        <linearGradient id="vj-tri-grad-full" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#D82618" />
          <stop offset="65%" stopColor="#EA4314" />
          <stop offset="100%" stopColor="#FA6507" />
        </linearGradient>

        {/* Left Red Wing Gradient */}
        <linearGradient id="vj-red-wing-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EB3E17" />
          <stop offset="50%" stopColor="#E3320E" />
          <stop offset="100%" stopColor="#DD2406" />
        </linearGradient>

        {/* Right Blue Wing Gradient */}
        <linearGradient id="vj-blue-wing-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E54E8" />
          <stop offset="60%" stopColor="#2449D8" />
          <stop offset="100%" stopColor="#1B3DC5" />
        </linearGradient>

        {/* Outer Blue Wings Gradient */}
        <linearGradient id="vj-blue-outer-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3259ED" />
          <stop offset="100%" stopColor="#1F42CE" />
        </linearGradient>

        {/* Seam Ambient Occlusion / Shadow */}
        <linearGradient id="vj-seam-shadow-full" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#582307" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#3F1905" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2449D8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Scaled Emblem Icon (Height 170, Aspect Ratio 1:1) */}
      <g transform="translate(15, 15) scale(0.17)">
        {/* 1. Left Outer Blue Stripe */}
        <polygon
          points="50,250 50,405 245,705 355,705 150,390 50,250"
          fill="url(#vj-blue-outer-full)"
          stroke="#1C37B0"
          strokeWidth="16"
          strokeLinejoin="round"
        />

        {/* 2. Right Outer Blue Stripe */}
        <polygon
          points="950,250 950,405 755,705 645,705 850,390 950,250"
          fill="url(#vj-blue-outer-full)"
          stroke="#1C37B0"
          strokeWidth="16"
          strokeLinejoin="round"
        />

        {/* 3. Top Center Inverted Triangle */}
        <polygon
          points="380,150 620,150 500,330"
          fill="url(#vj-tri-grad-full)"
          stroke="#B81E12"
          strokeWidth="20"
          strokeLinejoin="round"
        />

        {/* 4. Left Inner Red/Orange Main Chevron */}
        <polygon
          points="55,150 270,150 500,510 605,670 500,835"
          fill="url(#vj-red-wing-full)"
          stroke="#BF1F07"
          strokeWidth="16"
          strokeLinejoin="round"
        />

        {/* 5. Right Inner Blue Main Chevron */}
        <polygon
          points="730,150 945,150 605,670 500,510"
          fill="url(#vj-blue-wing-full)"
          stroke="#1C37B0"
          strokeWidth="16"
          strokeLinejoin="round"
        />

        {/* 6. Shadow / Bevel at Seam Overlap */}
        <polygon
          points="500,510 535,455 640,615 605,670"
          fill="url(#vj-seam-shadow-full)"
        />
      </g>

      {/* Wordmark "VajraGrid" with Crisp Notion Typography */}
      <text
        x="210"
        y="128"
        fill="#FFFFFF"
        fontFamily="'NotionInter', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="84"
        fontWeight="600"
        letterSpacing="-1.5px"
      >
        VajraGrid
      </text>
    </svg>
  );
};

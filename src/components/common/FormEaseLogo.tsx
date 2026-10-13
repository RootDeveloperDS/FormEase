import React from 'react';

interface FormEaseLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const FormEaseLogo: React.FC<FormEaseLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]"
      >
        <defs>
          {/* Main Background Gradient */}
          <linearGradient id="feBgGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Border Stroke Gradient */}
          <linearGradient id="feBorderGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Document Fold Gradient */}
          <linearGradient id="feDocGrad" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="feGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Squircle Container */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="url(#feBgGrad)"
          stroke="url(#feBorderGrad)"
          strokeWidth="1.5"
        />

        {/* Biometric Viewfinder Corner Brackets */}
        <path
          d="M9 16V10C9 9.44772 9.44772 9 10 9H16"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M39 16V10C39 9.44772 38.5523 9 38 9H32"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9 32V38C9 38.5523 9.44772 39 10 39H16"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M39 32V38C39 38.5523 38.5523 39 38 39H32"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Document Silhouette in Center */}
        <path
          d="M17 14C17 13.4477 17.4477 13 18 13H28L33 18V33C33 33.5523 32.5523 34 32 34H18C17.4477 34 17 33.5523 17 33V14Z"
          fill="url(#feDocGrad)"
          fillOpacity="0.22"
          stroke="url(#feDocGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Document Folded Corner */}
        <path
          d="M28 13V18H33"
          stroke="#34D399"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Biometric Portrait Silhouette inside Document */}
        <circle cx="25" cy="21.5" r="3.2" fill="#34D399" />
        <path
          d="M20.5 28.5C20.5 25.5 22.5 24.5 25 24.5C27.5 24.5 29.5 25.5 29.5 28.5"
          stroke="#34D399"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Verification Check Badge (Bottom-Right Anchor) */}
        <circle cx="34" cy="34" r="5" fill="#020617" stroke="#10B981" strokeWidth="1.5" />
        <path
          d="M32 34L33.3 35.3L36 32.5"
          stroke="#34D399"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-white leading-none">
            Form<span className="text-emerald-400">Ease</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
            Biometric Dossier Engine
          </span>
        </div>
      )}
    </div>
  );
};

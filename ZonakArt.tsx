import React from 'react';

export const ZonakSmiley: React.FC<{
  size?: number;
  className?: string;
  withHalo?: boolean;
}> = ({ size = 56, className = '', withHalo = false }) => (
  <div
    className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    {withHalo && (
      <div
        className="absolute inset-0 rounded-full bg-[#F1CC51]/45 blur-[2px] scale-125 pointer-events-none"
        aria-hidden="true"
      />
    )}
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className="relative z-10 drop-shadow-sm"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="zonakSun" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE57F" />
          <stop offset="100%" stopColor="#F1CC51" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#zonakSun)" />
      {/* Rosy cheeks */}
      <ellipse cx="22" cy="46" rx="5.5" ry="3.2" fill="#D85A30" opacity="0.35" />
      <ellipse cx="58" cy="46" rx="5.5" ry="3.2" fill="#D85A30" opacity="0.35" />
      {/* Happy closed-arc eyes */}
      <path
        d="M23 36 C25.5 31, 30.5 31, 33 36"
        fill="none"
        stroke="#185FA5"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M47 36 C49.5 31, 54.5 31, 57 36"
        fill="none"
        stroke="#185FA5"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Warm gentle smile */}
      <path
        d="M31 48 C34.5 54, 45.5 54, 49 48"
        fill="none"
        stroke="#185FA5"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export const ZonakLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    viewBox="0 0 40 40"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle cx="20" cy="20" r="20" fill="#185FA5" />
    <path
      d="M20 9 C24.5 14, 24.5 22, 20 29 C15.5 22, 15.5 14, 20 9 Z"
      fill="#FFFFFF"
      opacity="0.95"
    />
    <path
      d="M11 19 C15 19, 18.5 22.5, 20 29 C14 27, 11 23, 11 19 Z"
      fill="#F1CC51"
    />
    <path
      d="M29 19 C25 19, 21.5 22.5, 20 29 C26 27, 29 23, 29 19 Z"
      fill="#F1CC51"
    />
  </svg>
);

export const CozyTeaGirlArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 140 140" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cozyRoom" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FBE5C8" />
        <stop offset="100%" stopColor="#F4BE94" />
      </linearGradient>
    </defs>
    <rect width="140" height="140" rx="20" fill="url(#cozyRoom)" />
    {/* Soft window sunlight */}
    <rect x="14" y="16" width="44" height="58" rx="8" fill="#FFF6E5" opacity="0.85" />
    <line x1="36" y1="16" x2="36" y2="74" stroke="#E8C9A2" strokeWidth="2" />
    <line x1="14" y1="45" x2="58" y2="45" stroke="#E8C9A2" strokeWidth="2" />
    {/* Cozy character */}
    <circle cx="80" cy="58" r="24" fill="#A66A46" />
    <circle cx="80" cy="62" r="19" fill="#FAD2B8" />
    {/* Flower headband */}
    <circle cx="67" cy="46" r="5" fill="#F8E7B2" />
    <circle cx="80" cy="43" r="5.5" fill="#F1CC51" />
    <circle cx="93" cy="46" r="5" fill="#F4B4B4" />
    {/* Calm closed eyes */}
    <path d="M71 62 Q74 65 77 62" fill="none" stroke="#4D2F1E" strokeWidth="2" strokeLinecap="round" />
    <path d="M83 62 Q86 65 89 62" fill="none" stroke="#4D2F1E" strokeWidth="2" strokeLinecap="round" />
    <path d="M77 69 Q80 72 83 69" fill="none" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" />
    {/* Warm sweater */}
    <path d="M52 126 C52 94, 108 94, 108 126 Z" fill="#E8CFC0" />
    {/* Mint tea mug */}
    <rect x="69" y="92" width="22" height="22" rx="6" fill="#E6F4EE" stroke="#9ECDBB" strokeWidth="2" />
    <path d="M91 98 C97 98, 97 108, 91 108" fill="none" stroke="#9ECDBB" strokeWidth="2" />
    {/* Steam wisps */}
    <path d="M76 86 Q74 80 78 75" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    <path d="M84 85 Q82 79 86 74" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    {/* Floating warm sparkle dot */}
    <circle cx="24" cy="116" r="12" fill="#F1CC51" />
    <path d="M24 110 L25.5 114.5 L30 116 L25.5 117.5 L24 122 L22.5 117.5 L18 116 L22.5 114.5 Z" fill="#FFF9DC" />
  </svg>
);

export const CozyRestCharacterArt: React.FC<{ size?: number }> = ({ size = 112 }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
    <circle cx="60" cy="60" r="54" fill="#FCEFD4" />
    <rect x="20" y="76" width="80" height="24" rx="12" fill="#E9D6BC" />
    {/* Cozy character */}
    <circle cx="60" cy="54" r="24" fill="#E0A978" />
    <circle cx="43" cy="36" r="7" fill="#E0A978" />
    <circle cx="77" cy="36" r="7" fill="#E0A978" />
    <ellipse cx="60" cy="59" rx="14" ry="11" fill="#F9DEC4" />
    <path d="M48 50 Q51 47 54 50" fill="none" stroke="#4D2F1E" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M66 50 Q69 47 72 50" fill="none" stroke="#4D2F1E" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M56 61 Q60 64 64 61" fill="none" stroke="#4D2F1E" strokeWidth="2" strokeLinecap="round" />
    {/* Scarf */}
    <rect x="44" y="70" width="32" height="10" rx="5" fill="#185FA5" />
    {/* Warm teacup */}
    <rect x="51" y="77" width="18" height="16" rx="4" fill="#FFFFFF" stroke="#D5C7AE" strokeWidth="2" />
    <path d="M56 71 Q54 65 58 60" fill="none" stroke="#D5B883" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 71 Q62 65 66 60" fill="none" stroke="#D5B883" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const MoonCloudArt: React.FC<{ size?: number }> = ({ size = 84 }) => (
  <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
    <circle cx="48" cy="48" r="44" fill="#F1CC51" opacity="0.35" />
    <path
      d="M52 24 C38 25, 28 37, 29 51 C30 64, 41 74, 54 74 C63 74, 71 69, 75 61 C69 63, 62 62, 57 57 C50 50, 49 38, 56 30 C54 27, 53 25, 52 24 Z"
      fill="none"
      stroke="#185FA5"
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M58 63 H70 C73 63, 75 60.5, 75 58 C75 55.5, 73 53.5, 70.5 53.5 C69.8 50.5, 67 48.5, 64 48.5 C60.5 48.5, 57.5 51, 57.5 54.5 C55.5 55, 54 56.8, 54 59 C54 61.2, 55.8 63, 58 63 Z"
      fill="#FFF9E6"
      stroke="#185FA5"
      strokeWidth="2.2"
    />
  </svg>
);

import React from "react";

// A small flat-illustration scene: an apartment building at golden hour with
// a maintenance mascot out front. Built entirely from CSS-variable-driven
// SVG shapes so it always matches the app's palette.
export default function AuthIllustration() {
  return (
    <svg
      className="auth-illustration"
      viewBox="0 0 420 460"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of an apartment building with a maintenance mascot"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--grape)" />
        </linearGradient>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD37A" />
          <stop offset="100%" stopColor="var(--coral)" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="420" height="460" rx="28" fill="url(#skyGrad)" />

      {/* Sun */}
      <circle cx="320" cy="90" r="46" fill="url(#sunGrad)" opacity="0.9" />

      {/* Clouds */}
      <g opacity="0.18" fill="#FFFFFF">
        <ellipse cx="80" cy="70" rx="38" ry="14" />
        <ellipse cx="105" cy="62" rx="26" ry="12" />
        <ellipse cx="250" cy="150" rx="30" ry="11" />
      </g>

      {/* Ground */}
      <rect x="0" y="400" width="420" height="60" fill="#FFFFFF" opacity="0.08" />

      {/* Trees */}
      <g>
        <rect x="46" y="360" width="8" height="40" rx="3" fill="#FFFFFF" opacity="0.35" />
        <circle cx="50" cy="352" r="22" fill="var(--mint)" opacity="0.55" />
        <rect x="358" y="368" width="7" height="32" rx="3" fill="#FFFFFF" opacity="0.35" />
        <circle cx="361" cy="360" r="18" fill="var(--mint)" opacity="0.55" />
      </g>

      {/* Building */}
      <g>
        {/* Roof */}
        <path d="M 100 190 L 210 130 L 320 190 Z" fill="#2A2350" opacity="0.9" />
        {/* Body */}
        <rect x="115" y="190" width="190" height="210" rx="10" fill="#FFFFFF" opacity="0.95" />

        {/* Windows row 1 */}
        <rect x="135" y="212" width="34" height="34" rx="6" fill="var(--amber)" opacity="0.85" />
        <rect x="193" y="212" width="34" height="34" rx="6" fill="var(--primary-tint)" />
        <rect x="251" y="212" width="34" height="34" rx="6" fill="var(--amber)" opacity="0.85" />

        {/* Windows row 2 */}
        <rect x="135" y="262" width="34" height="34" rx="6" fill="var(--primary-tint)" />
        <rect x="193" y="262" width="34" height="34" rx="6" fill="var(--amber)" opacity="0.85" />
        <rect x="251" y="262" width="34" height="34" rx="6" fill="var(--primary-tint)" />

        {/* Balconies */}
        <rect x="130" y="248" width="44" height="6" rx="2" fill="#2A2350" opacity="0.5" />
        <rect x="246" y="248" width="44" height="6" rx="2" fill="#2A2350" opacity="0.5" />

        {/* Door */}
        <rect x="188" y="340" width="44" height="60" rx="6" fill="var(--grape)" opacity="0.7" />
        <circle cx="222" cy="372" r="2.4" fill="#FFF" />
      </g>

      {/* Maintenance mascot: friendly circle body with a wrench */}
      <g transform="translate(70,340)">
        <ellipse cx="20" cy="72" rx="26" ry="6" fill="#000" opacity="0.08" />
        <rect x="4" y="34" width="32" height="40" rx="14" fill="var(--coral)" />
        <circle cx="20" cy="20" r="18" fill="#FFE4C4" />
        <path d="M10 16 Q20 6 30 16" stroke="#2A2350" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="19" r="2" fill="#2A2350" />
        <circle cx="26" cy="19" r="2" fill="#2A2350" />
        {/* wrench */}
        <g transform="translate(30,42) rotate(20)">
          <rect x="0" y="0" width="26" height="7" rx="3.5" fill="var(--ink)" />
          <circle cx="24" cy="3.5" r="6" fill="none" stroke="var(--ink)" strokeWidth="3.5" />
        </g>
      </g>
    </svg>
  );
}

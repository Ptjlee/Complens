export function Logo({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <circle cx="16" cy="16" r="14" fill="url(#gradient-lens)" />
      <path
        d="M20 12A8 8 0 1 0 20 20"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="16" r="3" fill="#ffffff" />
      <defs>
        <radialGradient
          id="gradient-lens"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(16 16) rotate(90) scale(14)"
        >
          <stop stopColor="var(--color-pl-brand-light, #60a5fa)" />
          <stop offset="1" stopColor="var(--color-pl-accent, #6366f1)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

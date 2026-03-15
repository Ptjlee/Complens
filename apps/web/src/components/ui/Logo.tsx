export function Logo({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M 21.5 7.5 A 10 10 0 1 0 21.5 20.5"
        stroke="var(--color-pl-brand, #1A3E66)"
        strokeWidth="4"
      />
      <line
        x1="21.5"
        y1="20.5"
        x2="28"
        y2="27"
        stroke="var(--color-pl-accent, #C5A065)"
        strokeWidth="4"
      />
    </svg>
  );
}

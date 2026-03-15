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
        d="M 23.5 13.5 A 10 10 0 1 1 17.5 6.5"
        stroke="var(--color-pl-brand, #1A3E66)"
        strokeWidth="3.5"
      />
      <path
        d="M 25 1.5 Q 25 6 29.5 6 Q 25 6 25 10.5 Q 25 6 20.5 6 Q 25 6 25 1.5 Z"
        fill="var(--color-pl-brand, #1A3E66)"
      />
    </svg>
  );
}

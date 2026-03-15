import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="100%"
        height="100%"
      >
        <circle cx="16" cy="16" r="14" fill="#3b82f6" />
        <path
          d="M20 12A8 8 0 1 0 20 20"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="20" cy="16" r="3" fill="#ffffff" />
      </svg>
    ),
    { ...size }
  )
}

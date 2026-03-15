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
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="32" height="32" rx="6" fill="#000000" />
        <path
          d="M 23.5 13.5 A 10 10 0 1 1 17.5 6.5"
          stroke="#ffffff"
          strokeWidth="3.5"
        />
        <path
          d="M 25 1.5 Q 25 6 29.5 6 Q 25 6 25 10.5 Q 25 6 20.5 6 Q 25 6 25 1.5 Z"
          fill="#ffffff"
        />
      </svg>
    ),
    { ...size }
  )
}

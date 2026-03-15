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
        <path
          d="M 21.5 7.5 A 10 10 0 1 0 21.5 20.5"
          stroke="#1A3E66"
          strokeWidth="4.5"
        />
        <line
          x1="21.5"
          y1="20.5"
          x2="28"
          y2="27"
          stroke="#C5A065"
          strokeWidth="4.5"
        />
      </svg>
    ),
    { ...size }
  )
}

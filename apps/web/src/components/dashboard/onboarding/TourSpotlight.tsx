'use client'

import { useEffect, useState, useCallback } from 'react'

interface TourSpotlightProps {
    selector: string | null
    padding?: number
    onClick: () => void
}

function getRect(selector: string | null): DOMRect | null {
    if (!selector) return null
    const el = document.querySelector(selector)
    return el ? el.getBoundingClientRect() : null
}

export default function TourSpotlight({ selector, padding = 8, onClick }: TourSpotlightProps) {
    const [rect, setRect] = useState<DOMRect | null>(null)
    const [windowSize, setWindowSize] = useState({ w: 0, h: 0 })

    const measure = useCallback(() => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight })
        setRect(getRect(selector))
    }, [selector])

    useEffect(() => {
        measure()

        const ro = new ResizeObserver(measure)
        ro.observe(document.body)

        const onScroll = () => measure()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)

        return () => {
            ro.disconnect()
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', onScroll)
        }
    }, [measure])

    const { w, h } = windowSize
    if (w === 0) return null

    const cx = rect ? rect.x - padding : 0
    const cy = rect ? rect.y - padding : 0
    const cw = rect ? rect.width + padding * 2 : 0
    const ch = rect ? rect.height + padding * 2 : 0

    return (
        <svg
            onClick={onClick}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, cursor: 'pointer' }}
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
        >
            <defs>
                <mask id="tour-mask">
                    <rect x="0" y="0" width={w} height={h} fill="white" />
                    {rect && (
                        <rect
                            x={cx} y={cy} width={cw} height={ch}
                            rx="12" ry="12" fill="black"
                            style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
                        />
                    )}
                </mask>
            </defs>
            <rect
                x="0" y="0" width={w} height={h}
                fill="rgba(0,0,0,0.72)"
                mask="url(#tour-mask)"
            />
        </svg>
    )
}

export function useTargetRect(selector: string | null): DOMRect | null {
    const [rect, setRect] = useState<DOMRect | null>(null)

    const measure = useCallback(() => {
        setRect(getRect(selector))
    }, [selector])

    useEffect(() => {
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(document.body)
        window.addEventListener('scroll', measure, true)
        window.addEventListener('resize', measure)
        return () => {
            ro.disconnect()
            window.removeEventListener('scroll', measure, true)
            window.removeEventListener('resize', measure)
        }
    }, [measure])

    return rect
}

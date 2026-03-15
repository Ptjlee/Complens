"use client"

import * as React from "react"
import { Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex items-center justify-center p-1.5 rounded-lg transition-colors border"
        style={{
          border: '1px solid var(--color-pl-border)',
          background: 'var(--color-pl-bg)',
          color: 'var(--color-pl-text-tertiary)',
        }}
        aria-label="Toggle theme"
      >
        <div style={{ width: 16, height: 16 }} />
      </button>
    )
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
      className="flex items-center justify-center p-1.5 rounded-lg transition-colors border"
      style={{
        border: '1px solid var(--color-pl-border)',
        background: 'var(--color-pl-bg)',
        color: 'var(--color-pl-text-tertiary)',
      }}
      aria-label="Toggle theme"
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      {isDark ? (
        <Sun size={15} />
      ) : (
        <Moon size={15} />
      )}
    </button>
  )
}

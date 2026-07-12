'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

function applyTheme(theme: 'light' | 'dark') {
  const htmlElement = document.documentElement
  htmlElement.classList.remove('light', 'dark')
  htmlElement.classList.add(theme)
  htmlElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    const isDarkMode = theme === 'dark'
    setIsDark(isDarkMode)
    applyTheme(theme)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    applyTheme(newIsDark ? 'dark' : 'light')
    setIsDark(newIsDark)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  )
}

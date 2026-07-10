'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const htmlElement = document.documentElement
    const newIsDark = !isDark
    
    if (newIsDark) {
      htmlElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      htmlElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    setIsDark(newIsDark)
  }

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-lg border-border hover:bg-secondary"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </Button>
  )
}

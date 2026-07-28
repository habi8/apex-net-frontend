'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="site-header-floating">
      <div className="site-header-pill">
        <Link href="/" className="site-logo-link" aria-label="APEX-Net home">
          <Logo size={120} className="site-logo" />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ThemeToggle />
          <Link href="/auth/login" className="site-btn site-btn-ghost">
            Sign In
          </Link>
          <Link href="/auth/sign-up" className="site-btn site-btn-gradient">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  )
}
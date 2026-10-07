'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/client'

export type AppHeaderLink = {
  href: string
  label: string
  /** When true, this link is treated as the current page (visual highlight) */
  active?: boolean
}

type Props = {
  user: {
    email?: string | null
    user_metadata?: { full_name?: string | null; name?: string | null }
    identities?: Array<{ identity_data?: { full_name?: string; name?: string } }>
  } | null
  /** Extra nav links shown between the logo and the actions */
  links?: AppHeaderLink[]
  /** Show the user greeting on the right (defaults to true) */
  showGreeting?: boolean
}

function getUserDisplayName(user: Props['user']) {
  if (!user) return 'User'
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.identities?.[0]?.identity_data?.full_name ||
    user.identities?.[0]?.identity_data?.name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

export function AppHeader({ user, links = [], showGreeting = true }: Props) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="site-header-floating">
      <div className="site-header-pill app-header-pill">
        {/* Logo - top left */}
        <Link href="/dashboard" className="site-logo-link" aria-label="APEX-Net dashboard">
          <Logo size={108} className="site-logo" />
        </Link>

        {/* Full navigation on wider screens */}
        {links.length > 0 && (
          <nav className="app-header-links" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`glass-button ${l.active ? 'is-active' : ''}`}
                aria-current={l.active ? 'page' : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions remain compact on mobile so the menu stays visible. */}
        <div className="site-nav">
          {showGreeting && user && (
            <span className="app-header-greeting">
              <span className="app-header-greeting-label">Welcome,</span>
              <span className="app-header-greeting-name">{getUserDisplayName(user)}</span>
            </span>
          )}
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="glass-button glass-button-danger app-header-signout"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="app-header-signout-label">Sign Out</span>
          </button>
          {links.length > 0 && (
            <button
              type="button"
              className="glass-button app-header-menu-toggle"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="app-header-mobile-menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen
                ? <X className="h-4 w-4" aria-hidden="true" />
                : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
        </div>
        {links.length > 0 && isMenuOpen && (
          <nav id="app-header-mobile-menu" className="app-header-mobile-menu" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`glass-button ${link.active ? 'is-active' : ''}`}
                aria-current={link.active ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
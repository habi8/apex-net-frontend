'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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

        {/* Nav links - center, only on tablets+ */}
        {links.length > 0 && (
          <nav className="app-header-links" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`glass-button ${l.active ? 'is-active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side actions - theme + greeting + sign out */}
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
            className="glass-button glass-button-danger"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        router.push('/dashboard')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b glass-nav shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Logo size={240} />
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="outline" className="text-foreground border-border hover:bg-secondary">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
            AI-Powered Chest X-ray Analysis
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get rapid, accurate chest X-ray analysis with detailed findings and clinical recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium">
                Test X-Ray
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button 
                variant="outline"
                className="text-foreground border-border hover:bg-secondary px-8 py-6 text-base font-medium"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Animated Gradient Section */}
      <section className="relative overflow-hidden py-32 border-y border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent" style={{
          animation: 'gradient-shift 8s ease-in-out infinite'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="text-4xl font-bold text-foreground">Advanced AI Technology</h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powered by state-of-the-art deep learning models for accurate medical imaging analysis
          </p>
        </div>
        <style jsx>{`
          @keyframes gradient-shift {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2024 APEX-Net. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

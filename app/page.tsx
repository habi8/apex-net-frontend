'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

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
      <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 48 48" className="text-primary">
              <g fill="currentColor" fillOpacity="0.7">
                <path d="M24 8c-8 0-12 6-12 10v14c0 4 4 8 12 8s12-4 12-8V18c0-4-4-10-12-10z" />
                <path d="M18 18a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0" />
              </g>
            </svg>
            <h1 className="text-xl font-bold text-foreground">APEX-Net</h1>
          </div>
          
          <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              AI-Powered Chest X-ray Analysis
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              APEX-Net uses advanced artificial intelligence to provide rapid, accurate analysis of chest X-rays. Get detailed findings and clinical recommendations in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/sign-up">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium">
                  Start Free Trial
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="w-full sm:w-auto text-foreground border-border hover:bg-secondary px-8 py-6 text-base font-medium"
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-2xl p-12 border border-border">
              <div className="flex flex-col items-center justify-center space-y-4 py-16">
                <svg width="80" height="80" viewBox="0 0 48 48" className="text-primary animate-pulse">
                  <g fill="currentColor">
                    <path d="M24 8c-8 0-12 6-12 10v14c0 4 4 8 12 8s12-4 12-8V18c0-4-4-10-12-10z" />
                    <path d="M18 18a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0" />
                  </g>
                </svg>
                <p className="text-center text-muted-foreground font-medium">
                  Advanced AI Analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/50 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-foreground text-center mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Rapid Analysis',
                description: 'Get detailed X-ray analysis results in seconds, not hours'
              },
              {
                icon: '🎯',
                title: 'High Accuracy',
                description: 'State-of-the-art AI model trained on thousands of X-ray images'
              },
              {
                icon: '🔒',
                title: 'Secure & Compliant',
                description: 'Your data is encrypted and stored securely with HIPAA compliance'
              },
              {
                icon: '📊',
                title: 'Detailed Reports',
                description: 'Get comprehensive findings with confidence scores and recommendations'
              },
              {
                icon: '📱',
                title: 'Easy Upload',
                description: 'Simply drag and drop your X-ray image to get started'
              },
              {
                icon: '📈',
                title: 'Analysis History',
                description: 'Track and compare all your previous analyses in one place'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join healthcare professionals using APEX-Net for accurate, AI-powered chest X-ray analysis
          </p>
          <Link href="/auth/sign-up">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
                <li><a href="#" className="hover:text-primary">Compliance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">API Docs</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between text-muted-foreground text-sm">
            <p>&copy; 2024 APEX-Net. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-primary">Twitter</a>
              <a href="#" className="hover:text-primary">LinkedIn</a>
              <a href="#" className="hover:text-primary">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

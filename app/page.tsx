'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { XrayVisualizer } from '@/components/xray-visualizer'
import { SiteHeader } from '@/components/site-header'

const highlights = [
  {
    title: 'Rapid triage support',
    description: 'Surface likely findings quickly so teams can focus on the next best step.',
    icon: Zap,
  },
  {
    title: 'Clinical-grade summaries',
    description: 'Turn dense imaging outputs into clear, structured findings and recommendations.',
    icon: BrainCircuit,
  },
  {
    title: 'Secure collaboration',
    description: 'Keep analysis workflows organized, accessible, and protected for modern teams.',
    icon: ShieldCheck,
  },
]

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
    <div className="relative min-h-screen bg-transparent">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="hero-mesh absolute inset-0" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
            <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
              {/* Text column */}
              <div className="text-center lg:text-left">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:mb-6 sm:gap-2 sm:px-3 sm:text-sm">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  Clinical-grade AI imaging workflows
                </div>

                <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  See more with{' '}
                  <span className="text-gradient">precision-first</span> chest X-ray analysis.
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
                  APEX-Net helps medical teams move from imaging intake to actionable insight with faster review,
                  clearer findings, and confident next-step guidance.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-3 lg:justify-start sm:mt-8">
                  <Link href="/dashboard">
                    <button className="glass-button-primary inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold w-full sm:w-auto">
                      Test X-Ray
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <button className="glass-button h-11 px-6 rounded-xl text-sm font-semibold w-full sm:w-auto">
                      Create account
                    </button>
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start sm:mt-8 sm:gap-3">
                  <span className="pill text-xs sm:text-sm">Realtime insights</span>
                  <span className="pill text-xs sm:text-sm">Structured findings</span>
                  <span className="pill text-xs sm:text-sm">Secure workflow</span>
                </div>
              </div>

              {/* Right column - animated X-ray visualizer */}
              <div className="relative w-full">
                <div className="mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[480px]">
                  <XrayVisualizer />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid gap-3 sm:gap-5 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="section-card p-4 sm:p-6">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-2 sm:p-2.5 text-primary">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground sm:mt-4 sm:text-xl">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:mt-2 sm:text-sm">{item.description}</p>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-card/70 py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 text-center text-xs text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 sm:text-sm">
          <p>&copy; 2024 APEX-Net. Built for modern, precision-led imaging workflows.</p>
          <p>Secure, thoughtful, and clinically aligned.</p>
        </div>
      </footer>
    </div>
  )
}
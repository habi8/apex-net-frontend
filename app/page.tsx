'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { XrayVisualizer } from '@/components/xray-visualizer'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'

const workflowSteps = [
  {
    title: 'Upload an image',
    description: 'Add a chest X-ray image in the analysis workspace.',
  },
  {
    title: 'Review model outputs',
    description: 'See generated finding scores and attention heatmaps for the image.',
  },
  {
    title: 'Keep a saved record',
    description: 'Return to completed analyses from your history when needed.',
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
          <div className="relative mx-auto max-w-7xl px-4 py-[var(--section-space)] sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Text column */}
              <div className="text-center lg:text-left">
                <h1 className="fade-in-up fade-in-2 text-3xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  Review chest X-ray model outputs in one workspace.
                </h1>

                <p className="fade-in-up fade-in-3 mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
                  Upload an image to review generated finding scores and attention heatmaps, then return to saved
                  analyses in your history. For research and educational use only; not for diagnosis or treatment.
                </p>

                <div className="fade-in-up fade-in-4 mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start sm:mt-8">
                  <Button
                    render={<Link href="/dashboard" />}
                    className="h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto"
                  >
                    Open workspace
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    render={<Link href="/auth/sign-up" />}
                    className="h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto"
                  >
                    Create account
                  </Button>
                </div>
              </div>

              {/* Right column - animated X-ray visualizer */}
              <div className="fade-in-up fade-in-3 relative w-full lg:fade-in-2">
                <div className="mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[480px]">
                  <XrayVisualizer />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-4 pb-[var(--section-space)] sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold text-primary">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              From image upload to saved results
            </h2>
          </div>
          <ol className="grid gap-8 border-t border-border/70 pt-6 md:grid-cols-3 md:gap-10">
            {workflowSteps.map((item, idx) => {
              return (
                <li key={item.title} className="fade-in-up space-y-3">
                  <p className="font-mono-numeric text-sm text-primary">0{idx + 1}</p>
                  <h3 className="text-lg font-semibold text-foreground sm:text-xl">{item.title}</h3>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">{item.description}</p>
                </li>
              )
            })}
          </ol>
        </section>
      </main>

      <footer className="fade-in fade-in-9 border-t border-border/70 py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 text-center text-xs text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 sm:text-sm">
          <p>&copy; {new Date().getFullYear()} APEX-Net.</p>
          <p>For research and educational use only. Not for diagnosis or treatment.</p>
        </div>
      </footer>
    </div>
  )
}
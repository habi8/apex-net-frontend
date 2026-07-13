'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/components/upload-area'
import { PredictionResults } from '@/components/prediction-results'
import { AnalysisHistory } from '@/components/analysis-history'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPrediction, setCurrentPrediction] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
    }

    checkAuth()
  }, [router])

  async function handleUploadComplete(uploadId: string, fileName: string) {
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('xrayUploadId', uploadId)
      formData.append('fileName', fileName)

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentPrediction(data.prediction)
        setHistoryRefresh(prev => prev + 1)
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b glass-nav shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={156} />
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{getUserDisplayName(user)}</span>
            </div>
            <Link href="/history">
              <Button variant="outline" className="text-foreground border-border hover:bg-secondary">
                History
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="text-foreground border-border hover:bg-secondary">
                Profile
              </Button>
            </Link>
            <Button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
              className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-2">Upload X-ray</h2>
              <p className="text-muted-foreground mb-6">
                Upload a chest X-ray image for AI-powered analysis
              </p>
              
              <UploadArea 
                onUploadComplete={handleUploadComplete}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Current Results */}
            {currentPrediction && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Analysis Results</h2>
                <PredictionResults prediction={currentPrediction} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-secondary border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Analyses</p>
                  <p className="text-2xl font-bold text-primary">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Confidence</p>
                  <p className="text-2xl font-bold text-primary">-</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">MODEL VERSION</p>
                  <p className="font-mono text-sm text-foreground">APEX-v2.1</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <AnalysisHistory refreshTrigger={historyRefresh} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function getUserDisplayName(user: any) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.identities?.[0]?.identity_data?.full_name ||
    user.identities?.[0]?.identity_data?.name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

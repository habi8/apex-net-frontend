'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadArea } from '@/components/upload-area'
import { PredictionResults } from '@/components/prediction-results'
import { AnalysisHistory } from '@/components/analysis-history'
import { AppHeader } from '@/components/app-header'

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
    <div className="min-h-screen bg-transparent">
      <AppHeader
        user={user}
        links={[
          { href: '/dashboard', label: 'Dashboard', active: true },
          { href: '/history', label: 'History' },
          { href: '/profile', label: 'Profile' },
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sm:p-8">
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
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
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
                <div className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Model version</p>
                  <p className="font-mono text-sm text-foreground">APEX-v2.1</p>
                </div>
              </div>
            </div>

            <AnalysisHistory refreshTrigger={historyRefresh} />
          </div>
        </div>
      </main>
    </div>
  )
}
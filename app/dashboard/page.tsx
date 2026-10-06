'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadArea } from '@/components/upload-area'
import { PredictionResults } from '@/components/prediction-results'
import { AnalysisHistory } from '@/components/analysis-history'
import { AppHeader } from '@/components/app-header'
import { DashboardQuickStats } from '@/components/dashboard-quick-stats'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPrediction, setCurrentPrediction] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
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

  async function handleUploadComplete(uploadId: string, fileName: string, file: File) {
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setAnalysisError('')
    try {
      const formData = new FormData()
      formData.append('xrayUploadId', uploadId)
      formData.append('fileName', fileName)
      formData.append('file', file, file.name)

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'APEX-Net analysis failed')
      }
      setCurrentPrediction(data.prediction)
      setAnalysisComplete(true)
      setHistoryRefresh(prev => prev + 1)
    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisError(
        error instanceof Error ? error.message : 'Unable to analyze this image'
      )
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
                onUploadStart={() => {
                  setCurrentPrediction(null)
                  setAnalysisComplete(false)
                  setAnalysisError('')
                }}
                isAnalyzing={isAnalyzing}
                analysisComplete={analysisComplete}
              />
              {analysisError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {analysisError}
                </p>
              )}
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
            <DashboardQuickStats
              userId={user.id}
              refreshTrigger={historyRefresh}
            />

            <AnalysisHistory
              refreshTrigger={historyRefresh}
              onDelete={(id) => {
                setCurrentPrediction((prediction: { id?: string } | null) =>
                  prediction?.id === id ? null : prediction
                )
                setHistoryRefresh((previous) => previous + 1)
                if (currentPrediction?.id === id) {
                  setAnalysisComplete(false)
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/components/upload-area'
import { PredictionResults } from '@/components/prediction-results'
import { AnalysisHistory } from '@/components/analysis-history'

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
      const response = await fetch('/api/predict', {
        method: 'POST',
        body: new FormData(Object.assign(new FormData(), {
          append: function(key: string, value: any) {
            if (key === 'xrayUploadId') FormData.prototype.append.call(this, key, uploadId)
            if (key === 'fileName') FormData.prototype.append.call(this, key, fileName)
          }
        })),
      })

      // Use a simpler approach - just send the uploadId
      const formData = new FormData()
      formData.append('xrayUploadId', uploadId)
      formData.append('fileName', fileName)

      const response2 = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      const data = await response2.json()
      
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
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user.email}</span>
            </div>
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

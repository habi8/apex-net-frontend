'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppHeader } from '@/components/app-header'

interface Finding {
  label: string
  confidence: number
  severity: string
  location: string
}

interface ResultDetail {
  id: string
  created_at: string
  file_name: string
  prediction_data: {
    findings: Finding[]
    overall_assessment: string
    recommendations: string[]
    analysis_date: string
    model_version: string
  }
}

export default function ResultDetailPage() {
  const router = useRouter()
  const params = useParams()
  const resultId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [result, setResult] = useState<ResultDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuthAndLoadResult() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: predictions, error: fetchError } = await supabase
        .from('predictions')
        .select(`
          id,
          created_at,
          prediction_data,
          xray_uploads (
            file_name
          )
        `)
        .eq('id', resultId)
        .single()

      if (fetchError) {
        console.error('Error loading result:', fetchError)
        router.push('/history')
        return
      }

      const upload = predictions.xray_uploads?.[0]
      setResult({
        id: predictions.id,
        created_at: predictions.created_at,
        file_name: upload?.file_name || 'Unknown file',
        prediction_data: predictions.prediction_data,
      })
      setIsLoading(false)
    }

    checkAuthAndLoadResult()
  }, [router, resultId])

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <AppHeader
          user={user}
          links={[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/history', label: 'History', active: true },
            { href: '/profile', label: 'Profile' },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 glass-card animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-transparent">
        <AppHeader
          user={user}
          links={[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/history', label: 'History', active: true },
            { href: '/profile', label: 'Profile' },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Result not found</p>
          <Link href="/history">
            <button className="glass-button-primary h-11 px-6 rounded-xl text-sm font-semibold">
              Back to History
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
      case 'moderate':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300'
      case 'mild':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
      case 'minimal':
        return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
      default:
        return 'bg-secondary/50 border-border text-foreground'
    }
  }

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-red-500'
    if (confidence >= 0.5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AppHeader
        user={user}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/history', label: 'History', active: true },
          { href: '/profile', label: 'Profile' },
        ]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/history" className="mb-6 inline-block">
          <button className="glass-button h-11 px-5 rounded-xl text-sm font-semibold">
            ← Back to History
          </button>
        </Link>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{result.file_name}</h1>
          <p className="text-muted-foreground">
            Analyzed on {new Date(result.created_at).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Model Version: {result.prediction_data.model_version}
          </p>
        </div>

        {/* X-ray Image Placeholder */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">X-ray Image</h2>
          <div className="h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
            <svg
              className="w-32 h-32 text-primary/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Overall Assessment</h2>
          <p className="text-foreground leading-relaxed">
            {result.prediction_data.overall_assessment}
          </p>
        </div>

        {/* All Disease Probabilities */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Disease Probabilities</h2>
          <div className="space-y-4">
            {result.prediction_data.findings.map((finding, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{finding.label}</span>
                  <span className="text-sm font-semibold text-primary font-mono-numeric">
                    {(finding.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getConfidenceBarColor(finding.confidence)} transition-all duration-500`}
                    style={{ width: `${finding.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Detailed Findings</h2>
          <div className="space-y-3">
            {result.prediction_data.findings.map((finding, idx) => (
              <div
                key={idx}
                className={`border-l-4 rounded-xl p-4 backdrop-blur-sm ${getSeverityStyle(finding.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{finding.label}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Severity:</span> {finding.severity}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Location:</span> {finding.location}
                    </p>
                  </div>
                  <p className="font-semibold text-lg font-mono-numeric">
                    {(finding.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Clinical Recommendations</h2>
          <ul className="space-y-2">
            {result.prediction_data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
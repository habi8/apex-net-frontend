'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AnalysisRecord {
  id: string
  created_at: string
  xray_uploads: { file_name: string } | { file_name: string }[] | null
  prediction_data: {
    findings: Array<{
      label: string
      confidence: number
    }>
  }
}

interface AnalysisHistoryProps {
  refreshTrigger?: number
  onDelete?: (id: string) => void
}

export function AnalysisHistory({ refreshTrigger = 0, onDelete }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function deleteAnalysis(id: string) {
    if (!window.confirm('Delete this analysis from your history?')) {
      return
    }

    setDeletingId(id)
    setDeleteError('')
    try {
      const response = await fetch(`/api/predictions/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete this analysis')
      }
      setHistory((records) => records.filter((record) => record.id !== id))
      onDelete?.(id)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete this analysis')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    async function loadHistory() {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            created_at,
            prediction_data,
            xray_uploads (
              file_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error loading history:', error)
          return
        }

        setHistory(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [refreshTrigger])

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-secondary/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>

      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm">No analyses yet. Upload an X-ray to get started.</p>
      ) : (
        <div className="space-y-2">
          {history.map((record) => {
            const upload = Array.isArray(record.xray_uploads)
              ? record.xray_uploads[0]
              : record.xray_uploads
            const maxConfidence = Math.max(
              ...record.prediction_data.findings.map(f => f.confidence)
            )

            return (
              <div
                key={record.id}
                className="p-3 bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm rounded-xl transition"
              >
                <Link href={`/history/${record.id}`} className="block">
                  <p className="text-sm font-medium text-foreground truncate">
                    {upload?.file_name || 'Unknown file'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                    <span className={`text-xs font-bold font-mono-numeric ${
                      maxConfidence >= 0.5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {(maxConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => deleteAnalysis(record.id)}
                  disabled={deletingId !== null}
                  aria-label={`Delete analysis ${upload?.file_name || 'Unknown file'}`}
                  className="mt-2 text-xs font-medium text-red-700 hover:underline disabled:opacity-50 dark:text-red-300"
                >
                  {deletingId === record.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {deleteError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{deleteError}</p>}
    </div>
  )
}

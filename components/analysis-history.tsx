'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { PredictionResults } from '@/components/prediction-results'

interface AnalysisFinding {
  label: string
  confidence: number
  severity?: string
  location?: string
}

interface AnalysisRecord {
  id: string
  created_at: string
  xray_uploads: { file_name: string } | { file_name: string }[] | null
  prediction_data: {
    findings: AnalysisFinding[]
    heatmaps?: Record<string, string>
    heatmap_method?: string
    overall_assessment?: string
    recommendations?: string[]
    analysis_date?: string
    model_version?: string
  }
}

interface SelectedAnalysis {
  record: AnalysisRecord
  heatmaps: Record<string, string>
}

interface AnalysisHistoryProps {
  userId: string
  refreshTrigger?: number
  onDelete?: (id: string) => void
}

export function AnalysisHistory({ userId, refreshTrigger = 0, onDelete }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; fileName: string } | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<SelectedAnalysis | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  async function viewAnalysis(record: AnalysisRecord) {
    const supabase = createClient()
    const heatmaps: Record<string, string> = {}
    await Promise.all(
      Object.entries(record.prediction_data.heatmaps ?? {}).map(async ([label, path]) => {
        if (path.startsWith('data:image/')) {
          heatmaps[label] = path
          return
        }
        const { data, error } = await supabase.storage
          .from('xray-uploads')
          .createSignedUrl(path, 60 * 60)
        if (error) {
          console.error(`Error loading recent analysis heatmap for ${label}:`, error)
          return
        }
        heatmaps[label] = data.signedUrl
      }),
    )

    setSelectedAnalysis({ record, heatmaps })
    setIsMounted(true)
    requestAnimationFrame(() => setIsExpanded(true))
  }

  function closeAnalysis() {
    setIsExpanded(false)
  }

  useEffect(() => {
    if (isExpanded) return
    const timeout = window.setTimeout(() => {
      setIsMounted(false)
      setSelectedAnalysis(null)
    }, 220)
    return () => window.clearTimeout(timeout)
  }, [isExpanded])

  useEffect(() => {
    if (!isMounted) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingDelete) closeAnalysis()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMounted, pendingDelete])

  useEffect(() => {
    if (!pendingDelete) return

    function closeDeleteDialog(event: KeyboardEvent) {
      if (event.key === 'Escape' && deletingId === null) {
        setPendingDelete(null)
        setDeleteError('')
      }
    }
    window.addEventListener('keydown', closeDeleteDialog)
    return () => window.removeEventListener('keydown', closeDeleteDialog)
  }, [pendingDelete, deletingId])

  async function deleteAnalysis(id: string) {
    setDeletingId(id)
    setDeleteError('')
    try {
      const response = await fetch(`/api/predictions/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete this analysis')
      }
      setHistory((records) => records.filter((record) => record.id !== id))
      if (selectedAnalysis?.record.id === id) closeAnalysis()
      setPendingDelete(null)
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
            .eq('user_id', userId)
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
  }, [refreshTrigger, userId])

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
              0,
              ...record.prediction_data.findings.map(f => f.confidence)
            )
            const fileName = upload?.file_name || 'Unknown file'

            return (
              <div
                key={record.id}
                className="p-3 bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm rounded-xl transition"
              >
                <button
                  type="button"
                  onClick={() => void viewAnalysis(record)}
                  aria-haspopup="dialog"
                  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {fileName}
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
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('')
                    setPendingDelete({ id: record.id, fileName })
                  }}
                  disabled={deletingId !== null}
                  aria-label={`Delete analysis ${fileName}`}
                  className="mt-2 text-xs font-medium text-red-700 hover:underline disabled:opacity-50 dark:text-red-300"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
      {deleteError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{deleteError}</p>}
      {isMounted && selectedAnalysis && createPortal(
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-3 transition-colors duration-300 sm:p-6 ${
            isExpanded ? 'bg-slate-950/45 backdrop-blur-md' : 'bg-transparent backdrop-blur-none'
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAnalysis()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-analysis-title"
            className={`glass-card themed-scrollbar relative max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5 shadow-2xl transition-all duration-300 ease-out sm:p-8 ${
              isExpanded ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.96] opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={closeAnalysis}
              aria-label="Close recent analysis"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-xl text-foreground transition hover:rotate-90 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ×
            </button>
            <div className="mb-6 pr-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Recent analysis</p>
              <h2 id="recent-analysis-title" className="mt-1 break-words text-2xl font-bold text-foreground sm:text-3xl">
                {Array.isArray(selectedAnalysis.record.xray_uploads)
                  ? selectedAnalysis.record.xray_uploads[0]?.file_name || 'X-ray analysis'
                  : selectedAnalysis.record.xray_uploads?.file_name || 'X-ray analysis'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Analyzed on {new Date(selectedAnalysis.record.created_at).toLocaleString()}
              </p>
            </div>

            <PredictionResults
              prediction={{
                findings: selectedAnalysis.record.prediction_data.findings,
                heatmaps: selectedAnalysis.heatmaps,
                heatmap_method: selectedAnalysis.record.prediction_data.heatmap_method,
                overall_assessment: selectedAnalysis.record.prediction_data.overall_assessment ?? 'No overall assessment is available.',
                analysis_date: selectedAnalysis.record.prediction_data.analysis_date ?? selectedAnalysis.record.created_at,
                model_version: selectedAnalysis.record.prediction_data.model_version ?? 'Unknown',
              }}
            />

            {selectedAnalysis.record.prediction_data.findings.some(
              (finding) => finding.severity || finding.location,
            ) && (
              <section className="glass-card mt-6 p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Detailed findings</h3>
                <div className="space-y-3">
                  {selectedAnalysis.record.prediction_data.findings.map((finding) => (
                    <div key={finding.label} className="rounded-xl bg-secondary/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{finding.label}</p>
                        <p className="font-mono-numeric text-sm font-semibold text-primary">
                          {(finding.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      {(finding.severity || finding.location) && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {finding.severity && `Severity: ${finding.severity}`}
                          {finding.severity && finding.location && ' · '}
                          {finding.location && `Location: ${finding.location}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!selectedAnalysis.record.prediction_data.recommendations?.length && (
              <section className="glass-card mt-6 p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">Clinical recommendations</h3>
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                  {selectedAnalysis.record.prediction_data.recommendations.map((recommendation, index) => (
                    <li key={`${index}-${recommendation}`}>{recommendation}</li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        </div>,
        document.body,
      )}
      {pendingDelete && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setPendingDelete(null)
              setDeleteError('')
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-analysis-title"
            aria-describedby="delete-analysis-description"
            className="glass-card w-full max-w-md border border-red-500/20 p-6 shadow-2xl"
          >
            <h2 id="delete-analysis-title" className="text-lg font-semibold text-foreground">
              Delete this analysis?
            </h2>
            <p id="delete-analysis-description" className="mt-2 break-words text-sm text-muted-foreground">
              This will permanently remove the analysis for <span className="font-medium text-foreground">{pendingDelete.fileName}</span> from your history.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null)
                  setDeleteError('')
                }}
                disabled={deletingId !== null}
                className="glass-button h-10 px-4 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAnalysis(pendingDelete.id)}
                disabled={deletingId !== null}
                className="glass-button-danger glass-button h-10 px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
              >
                {deletingId === pendingDelete.id ? 'Deleting...' : 'Delete analysis'}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}

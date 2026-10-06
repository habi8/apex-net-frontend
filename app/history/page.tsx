'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppHeader } from '@/components/app-header'

interface HistoryItem {
  id: string
  created_at: string
  file_name: string
  heatmap_url?: string
  prediction_data: {
    findings: Array<{
      label: string
      confidence: number
    }>
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  function cancelSelection() {
    setIsSelecting(false)
    setSelectedIds([])
    setShowBulkDeleteConfirmation(false)
    setPendingDeleteId(null)
    setDeleteError('')
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id],
    )
  }

  async function confirmDelete() {
    if (pendingDeleteId) {
      const id = pendingDeleteId
      setDeletingId(id)
      setDeleteError('')
      try {
        const response = await fetch(`/api/predictions/${id}`, { method: 'DELETE' })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Unable to delete this analysis')
        }
        setHistory((items) => items.filter((item) => item.id !== id))
        setSelectedIds((ids) => ids.filter((selectedId) => selectedId !== id))
        setShowBulkDeleteConfirmation(false)
        setPendingDeleteId(null)
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : 'Unable to delete this analysis')
      } finally {
        setDeletingId(null)
      }
      return
    }

    setIsBulkDeleting(true)
    setDeleteError('')
    try {
      const response = await fetch('/api/predictions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete selected analyses')
      }
      const deletedIds = new Set<string>(data.deletedIds)
      setHistory((items) => items.filter((item) => !deletedIds.has(item.id)))
      cancelSelection()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete selected analyses')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  async function deleteAnalysis(id: string) {
    setPendingDeleteId(id)
    setShowBulkDeleteConfirmation(true)
    setDeleteError('')
  }

  useEffect(() => {
    async function checkAuthAndLoadHistory() {
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
        .order('created_at', { ascending: sortBy === 'oldest' })

      if (fetchError) {
        console.error('Error loading history:', fetchError)
        return
      }

      const formattedHistory = await Promise.all(predictions.map(async (pred: any) => {
        const upload = Array.isArray(pred.xray_uploads)
          ? pred.xray_uploads[0]
          : pred.xray_uploads
        const heatmapPath = Object.values(pred.prediction_data.heatmaps ?? {})
          .find((path): path is string => typeof path === 'string')
        let heatmapUrl: string | undefined

        if (heatmapPath) {
          if (heatmapPath.startsWith('data:image/')) {
            heatmapUrl = heatmapPath
          } else {
            const { data, error: imageError } = await supabase.storage
              .from('xray-uploads')
              .createSignedUrl(heatmapPath, 60 * 60)
            if (imageError) {
              console.error(`Error loading history heatmap for ${pred.id}:`, imageError)
            } else {
              heatmapUrl = data.signedUrl
            }
          }
        }

        return {
          id: pred.id,
          created_at: pred.created_at,
          file_name: upload?.file_name || 'Unknown file',
          heatmap_url: heatmapUrl,
          prediction_data: pred.prediction_data,
        }
      }))

      setHistory(formattedHistory)
      setIsLoading(false)
    }

    checkAuthAndLoadHistory()
  }, [router, sortBy])

  if (!user) {
    return null
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Analysis History</h2>
          <p className="text-muted-foreground">View your past X-ray analyses</p>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
          {!isSelecting && (
            <>
              <button
                onClick={() => setSortBy('newest')}
                className={`glass-button ${sortBy === 'newest' ? 'is-active' : ''}`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`glass-button ${sortBy === 'oldest' ? 'is-active' : ''}`}
              >
                Oldest First
              </button>
              <button
                type="button"
                onClick={() => setIsSelecting(true)}
                className="glass-button"
              >
                Select
              </button>
            </>
          )}
          {isSelecting && (
            <>
              <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
                {selectedIds.length} selected
              </p>
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteId(null)
                  setShowBulkDeleteConfirmation(true)
                }}
                disabled={selectedIds.length === 0}
                className="glass-button h-11 px-5 text-red-700 disabled:opacity-50 dark:text-red-300"
              >
                Delete selected
              </button>
              <button type="button" onClick={cancelSelection} className="glass-button">
                Cancel
              </button>
            </>
          )}
        </div>

        {/* History Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-40 bg-secondary/60 rounded-lg mb-4" />
                <div className="h-4 bg-secondary/60 rounded mb-2" />
                <div className="h-4 bg-secondary/60 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card text-center py-12 px-6">
            <p className="text-muted-foreground mb-4">No analyses yet</p>
            <Link href="/dashboard">
              <button className="glass-button-primary h-11 px-6 rounded-xl text-sm font-semibold">
                Upload Your First X-ray
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => {
              const topFinding = item.prediction_data.findings.reduce((prev, current) =>
                prev.confidence > current.confidence ? prev : current
              )

              const cardContent = (
                <>
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {item.heatmap_url ? (
                        <img
                          src={item.heatmap_url}
                          alt={`X-ray heatmap for ${item.file_name}`}
                          className="h-full w-full object-contain bg-black"
                        />
                      ) : (
                        <svg
                          className="w-16 h-16 text-primary/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        {item.file_name}
                      </p>
                      <p className="text-foreground font-semibold mt-2">
                        {topFinding.label}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium text-primary font-mono-numeric">
                          {(topFinding.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                </>
              )

              return (
                <div key={item.id} className="glass-card relative overflow-hidden transition-all h-full">
                  {isSelecting ? (
                    <button
                      type="button"
                      onClick={() => toggleSelected(item.id)}
                      aria-pressed={selectedIds.includes(item.id)}
                      aria-label={`${selectedIds.includes(item.id) ? 'Deselect' : 'Select'} analysis ${item.file_name}`}
                      className={`block w-full text-left transition-all ${
                        selectedIds.includes(item.id) ? 'ring-4 ring-primary' : ''
                      }`}
                    >
                      {cardContent}
                      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border-2 border-white bg-background text-sm font-bold text-primary shadow">
                        {selectedIds.includes(item.id) ? '✓' : ''}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={`/history/${item.id}`}
                      className="block hover:scale-[1.02] hover:-translate-y-0.5 transition-all"
                    >
                      {cardContent}
                    </Link>
                  )}
                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => deleteAnalysis(item.id)}
                      disabled={deletingId !== null || isSelecting}
                      aria-label={`Delete analysis ${item.file_name}`}
                      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50 dark:text-red-300"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {deleteError && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{deleteError}</p>}
      </main>
      {showBulkDeleteConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
            aria-describedby="delete-confirmation-description"
            className="glass-card w-full max-w-md bg-background/95 p-6 shadow-2xl dark:bg-slate-900/95"
          >
            <h2 id="delete-confirmation-title" className="text-xl font-semibold text-foreground">
              {pendingDeleteId ? 'Delete this analysis?' : 'Delete selected analyses?'}
            </h2>
            <p id="delete-confirmation-description" className="mt-3 text-sm text-muted-foreground">
              {pendingDeleteId
                ? 'This will permanently delete this result from your history.'
                : `This will permanently delete ${selectedIds.length} selected ${selectedIds.length === 1 ? 'result' : 'results'} from your history.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteConfirmation(false)
                  setPendingDeleteId(null)
                }}
                disabled={isBulkDeleting || deletingId !== null}
                className="glass-button h-11 px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isBulkDeleting || deletingId !== null}
                className="glass-button h-11 px-5 text-red-700 disabled:opacity-50 dark:text-red-300"
              >
                {isBulkDeleting || deletingId !== null
                  ? 'Deleting...'
                  : 'Delete permanently'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
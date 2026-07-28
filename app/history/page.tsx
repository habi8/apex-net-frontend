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

      const formattedHistory = predictions.map((pred: any) => ({
        id: pred.id,
        created_at: pred.created_at,
        file_name: pred.xray_uploads?.file_name || 'Unknown file',
        prediction_data: pred.prediction_data,
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
        <div className="mb-6 flex gap-2 sm:gap-3">
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

              return (
                <Link key={item.id} href={`/history/${item.id}`}>
                  <div className="glass-card overflow-hidden hover:scale-[1.02] hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                    {/* Placeholder Thumbnail */}
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Content */}
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
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
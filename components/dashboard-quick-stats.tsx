'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PredictionRecord {
  id: string
  created_at: string
  confidence_score: number | null
  findings_summary: Array<{
    label: string
    confidence: number
  }> | null
}

interface DashboardQuickStatsProps {
  userId: string
  refreshTrigger: number
}

interface DiseaseFrequency {
  label: string
  count: number
  percentage: number
}

const STATS_PAGE_SIZE = 100

async function loadUserPredictionRecords(
  userId: string,
): Promise<PredictionRecord[]> {
  const supabase = createClient()
  const records: PredictionRecord[] = []

  for (let offset = 0; ; offset += STATS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('predictions')
      .select('id, created_at, confidence_score, findings_summary')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + STATS_PAGE_SIZE - 1)

    if (error) throw error

    const page = (data ?? []) as PredictionRecord[]
    records.push(...page)
    if (page.length < STATS_PAGE_SIZE) return records
  }
}

function DiseaseFrequencyChart({
  diseases,
  expanded = false,
}: {
  diseases: DiseaseFrequency[]
  expanded?: boolean
}) {
  const visibleDiseases = expanded ? diseases : diseases.slice(0, 3)

  if (visibleDiseases.length === 0) {
    return <p className="text-sm text-muted-foreground">Disease frequencies will appear after analyses are saved.</p>
  }

  return (
    <div className={expanded ? 'space-y-4' : 'space-y-3'}>
      {visibleDiseases.map((disease) => (
        <div key={disease.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-foreground">{disease.label}</span>
            <span className="shrink-0 font-mono-numeric text-muted-foreground">
              {disease.count} · {disease.percentage.toFixed(0)}%
            </span>
          </div>
          <div
            className={`w-full overflow-hidden rounded-full bg-secondary/70 ${expanded ? 'h-2.5' : 'h-1.5'}`}
            role="img"
            aria-label={`${disease.label}: found in ${disease.count} analyses, ${disease.percentage.toFixed(0)} percent`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(disease.percentage, disease.count > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardQuickStats({
  userId,
  refreshTrigger,
}: DashboardQuickStatsProps) {
  const [records, setRecords] = useState<PredictionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setRecords(await loadUserPredictionRecords(userId))
    } catch (loadError) {
      const errorDetails = typeof loadError === 'object' && loadError !== null &&
        'message' in loadError && typeof loadError.message === 'string'
        ? loadError
        : null
      const message = errorDetails?.message ?? 'An unexpected error occurred.'
      const code = errorDetails && 'code' in errorDetails &&
        typeof errorDetails.code === 'string'
        ? errorDetails.code
        : null
      console.error(
        code
          ? `Error loading dashboard stats (${code}): ${message}`
          : `Error loading dashboard stats: ${message}`,
        loadError,
      )
      setError(`Unable to load analysis statistics${code ? ` (${code})` : ''}: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadStats()
  }, [loadStats, refreshTrigger])

  useEffect(() => {
    if (isExpanded) {
      setIsMounted(true)
      return
    }
    const timeout = window.setTimeout(() => setIsMounted(false), 220)
    return () => window.clearTimeout(timeout)
  }, [isExpanded])

  useEffect(() => {
    if (!isMounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMounted])

  const stats = useMemo(() => {
    const confidenceScores = records.map((record) =>
      record.confidence_score ??
      Math.max(0, ...(record.findings_summary ?? []).map((finding) => finding.confidence)),
    )
    const averageConfidence = confidenceScores.length
      ? confidenceScores.reduce((total, score) => total + score, 0) / confidenceScores.length
      : 0
    const frequencies = new Map<string, number>()
    let highConfidenceFindingCount = 0

    for (const record of records) {
      const qualifyingLabels = new Set(
        (record.findings_summary ?? [])
          .filter((finding) => finding.confidence >= 0.5)
          .map((finding) => finding.label),
      )
      highConfidenceFindingCount += qualifyingLabels.size
      for (const label of qualifyingLabels) {
        frequencies.set(label, (frequencies.get(label) ?? 0) + 1)
      }
    }

    const diseases = [...frequencies.entries()]
      .map(([label, count]) => ({
        label,
        count,
        percentage: records.length ? (count / records.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    const leadingDisease = diseases[0]

    return {
      averageConfidence,
      diseases,
      highConfidenceFindingCount,
      leadingDisease,
      latestAnalysis: records[0]?.created_at,
    }
  }, [records])

  function openStats() {
    setIsMounted(true)
    requestAnimationFrame(() => setIsExpanded(true))
  }

  const detailContent = (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">Total analyses</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{records.length}</p>
        </div>
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">Avg. top score</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {(stats.averageConfidence * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">High-score findings</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.highConfidenceFindingCount}</p>
        </div>
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">Labels tracked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.diseases.length}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-secondary/30 p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Disease frequency</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Analyses with a model score of 50% or higher
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Share of all analyses</p>
        </div>
        <DiseaseFrequencyChart diseases={stats.diseases} expanded />
      </section>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">Most frequent finding</p>
          <p className="mt-1 font-semibold text-foreground">
            {stats.leadingDisease
              ? `${stats.leadingDisease.label} · ${stats.leadingDisease.count} ${stats.leadingDisease.count === 1 ? 'analysis' : 'analyses'}`
              : 'No findings at or above 50%'}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">Most recent analysis</p>
          <p className="mt-1 font-semibold text-foreground">
            {stats.latestAnalysis ? new Date(stats.latestAnalysis).toLocaleString() : 'No analyses yet'}
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Model scores are not calibrated diagnostic probabilities. Frequency counts reflect model outputs above the display threshold, not confirmed diagnoses.
      </p>
    </>
  )

  return (
    <>
      <button
        type="button"
        onClick={openStats}
        aria-haspopup="dialog"
        className="glass-card group block w-full cursor-pointer p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Quick Stats</h3>
          <span className="text-xs font-medium text-primary transition-transform group-hover:translate-x-1">
            View details →
          </span>
        </div>
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total analyses</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {isLoading
                    ? <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-secondary/70 align-middle" aria-label="Loading" />
                    : records.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average top score</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {isLoading
                    ? <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-secondary/70 align-middle" aria-label="Loading" />
                    : `${(stats.averageConfidence * 100).toFixed(1)}%`}
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Disease frequency
              </p>
              {isLoading
                ? <div className="h-16 animate-pulse rounded-lg bg-secondary/60" />
                : <DiseaseFrequencyChart diseases={stats.diseases} />}
            </div>
            {!isLoading && records.length === 0 && (
              <p className="mt-4 text-xs text-muted-foreground">Your saved analysis statistics will appear here.</p>
            )}
          </>
        )}
      </button>

      {isMounted && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-3 transition-colors duration-300 sm:p-6 ${
            isExpanded ? 'bg-slate-950/45 backdrop-blur-md' : 'bg-transparent backdrop-blur-none'
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsExpanded(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-stats-title"
            className={`glass-card themed-scrollbar relative max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5 shadow-2xl transition-all duration-300 ease-out sm:p-8 ${
              isExpanded ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.96] opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close quick stats"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-xl text-foreground transition hover:rotate-90 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ×
            </button>
            <div className="mb-6 pr-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your overview</p>
              <h2 id="dashboard-stats-title" className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Analysis statistics
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A summary of your saved X-ray analyses and model findings.
              </p>
            </div>
            {error ? (
              <div role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : isLoading ? (
              <div className="space-y-4" aria-label="Loading statistics">
                <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
                <div className="h-56 animate-pulse rounded-2xl bg-secondary/60" />
              </div>
            ) : detailContent}
          </section>
        </div>
      )}
    </>
  )
}

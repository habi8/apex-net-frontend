'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AnalysisRecord {
  id: string
  created_at: string
  xray_uploads: {
    file_name: string
  }
  prediction_data: {
    findings: Array<{
      label: string
      confidence: number
    }>
  }
}

interface AnalysisHistoryProps {
  refreshTrigger?: number
}

export function AnalysisHistory({ refreshTrigger = 0 }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>
      
      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm">No analyses yet. Upload an X-ray to get started.</p>
      ) : (
        <div className="space-y-2">
          {history.map((record) => {
            const topFinding = record.prediction_data.findings[0]
            const maxConfidence = Math.max(
              ...record.prediction_data.findings.map(f => f.confidence)
            )
            
            return (
              <div
                key={record.id}
                className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition cursor-pointer"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {record.xray_uploads?.file_name || 'Unknown file'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                  <span className={`text-xs font-bold ${
                    maxConfidence >= 0.5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(maxConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

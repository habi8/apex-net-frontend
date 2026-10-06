'use client'

import { useState } from 'react'

interface Finding {
  label: string
  confidence: number
}

interface PredictionResultsProps {
  prediction: {
    findings: Finding[]
    heatmaps?: Record<string, string>
    heatmap_method?: string
    overall_assessment: string
    analysis_date: string
    model_version: string
  }
}

export function PredictionResults({ prediction }: PredictionResultsProps) {
  const heatmapLabels = Object.keys(prediction.heatmaps ?? {})
  const [selectedLabel, setSelectedLabel] = useState(heatmapLabels[0] ?? '')
  const availableLabel = heatmapLabels.includes(selectedLabel)
    ? selectedLabel
    : (heatmapLabels[0] ?? '')

  return (
    <div className="space-y-6">
      {availableLabel && prediction.heatmaps && (
        <section className="glass-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Attention heatmap: {availableLabel}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {prediction.heatmap_method}
          </p>
          <div className="overflow-hidden rounded-xl bg-black">
            <img
              src={prediction.heatmaps[availableLabel]}
              alt={`Lung-constrained model attention overlay for ${availableLabel}`}
              className="mx-auto max-h-[640px] w-full object-contain"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {heatmapLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedLabel(label)}
                aria-pressed={availableLabel === label}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  availableLabel === label
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            This is a model-attention visualization constrained to the predicted lung
            mask. It is not a confirmed disease location, lesion boundary, or medical
            diagnosis.
          </p>
        </section>
      )}

      <section className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">APEX-Net model scores</h3>
        <div className="space-y-3">
          {prediction.findings.map((finding) => (
            <div key={finding.label}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={!heatmapLabels.includes(finding.label)}
                  onClick={() => setSelectedLabel(finding.label)}
                  className="text-left text-sm font-medium text-foreground enabled:hover:text-primary disabled:cursor-default"
                >
                  {finding.label}
                </button>
                <span className="font-mono-numeric text-sm font-semibold text-primary">
                  {(finding.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, finding.confidence * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Scores are sigmoid model outputs and are not calibrated diagnostic
          probabilities or estimates of disease severity.
        </p>
      </section>

      <section className="glass-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About this result</h3>
        <p className="text-sm leading-relaxed text-foreground">
          {prediction.overall_assessment}
        </p>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <p>Analysis date: {new Date(prediction.analysis_date).toLocaleString()}</p>
          <p>Model: {prediction.model_version}</p>
        </div>
      </section>

      <div className="glass-card p-4 text-sm text-foreground">
        <p className="font-semibold">Research-use limitation</p>
        <p className="mt-1">
          This demo output is not medical advice and must not be used as a substitute
          for interpretation by a qualified healthcare professional.
        </p>
      </div>
    </div>
  )
}

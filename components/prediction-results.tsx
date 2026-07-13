'use client'

interface Finding {
  label: string
  confidence: number
  severity: string
  location: string
}

interface PredictionResultsProps {
  prediction: {
    findings: Finding[]
    overall_assessment: string
    recommendations: string[]
    analysis_date: string
    model_version: string
  }
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'severe':
      return 'bg-red-50 border-red-200 text-red-900'
    case 'moderate':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900'
    case 'mild':
      return 'bg-blue-50 border-blue-200 text-blue-900'
    case 'minimal':
      return 'bg-green-50 border-green-200 text-green-900'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-900'
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'text-red-600'
  if (confidence >= 0.5) return 'text-yellow-600'
  return 'text-green-600'
}

export function PredictionResults({ prediction }: PredictionResultsProps) {
  return (
    <div className="space-y-6">
      {/* Findings */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Key Findings</h3>
        <div className="space-y-3">
          {prediction.findings.map((finding, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{finding.label}</h4>
                <span className={`text-sm font-bold font-mono-numeric ${getConfidenceColor(finding.confidence)}`}>
                  {(finding.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Severity:</span>{' '}
                  <span className="capitalize">{finding.severity}</span>
                </p>
                <p>
                  <span className="font-medium">Location:</span> {finding.location}
                </p>
              </div>
              <div className="mt-3 bg-black/10 rounded-full h-2 w-full">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${finding.confidence * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Overall Assessment</h3>
        <p className="text-foreground leading-relaxed">
          {prediction.overall_assessment}
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Clinical Recommendations</h3>
        <ul className="space-y-2">
          {prediction.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-accent mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary rounded-lg p-4">
        <div>
          <p>Analysis Date: {new Date(prediction.analysis_date).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p>Model: {prediction.model_version}</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-1">Disclaimer</p>
        <p>This analysis is AI-assisted and for reference only. Clinical diagnosis should be made by qualified healthcare professionals.</p>
      </div>
    </div>
  )
}

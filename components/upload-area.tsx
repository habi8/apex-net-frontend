'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface UploadAreaProps {
  onUploadComplete: (uploadId: string, fileName: string, file: File) => void
  onUploadStart?: () => void
  isAnalyzing?: boolean
  analysisComplete?: boolean
}

export function UploadArea({
  onUploadComplete,
  onUploadStart,
  isAnalyzing = false,
  analysisComplete = false,
}: UploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError('')
    setProgress(0)
    onUploadStart?.()
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Upload failed')
        setIsUploading(false)
        return
      }

      setProgress(100)
      setIsUploading(false)
      onUploadComplete(data.uploadId, data.fileName, file)
    } catch (err) {
      setError('An error occurred during upload')
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative glass-card p-12 text-center transition cursor-pointer ${
          isDragActive
            ? 'ring-2 ring-primary/50 bg-primary/5'
            : 'hover:bg-white/40 dark:hover:bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="hidden"
          disabled={isUploading || isAnalyzing}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-primary opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M2 12a10 10 0 1020 0 10 10 0 00-20 0z"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              Drag and drop your X-ray image here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAnalyzing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Select File'}
          </Button>

          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, or BMP up to 10MB
          </p>
        </div>
      </div>

      {progress > 0 && progress < 100 && (
        <div className="mt-4">
          <div className="w-full bg-secondary/60 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress}% uploaded</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {progress === 100 && isAnalyzing && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="mt-4 overflow-hidden rounded-2xl border border-primary/15 bg-primary/10 p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Analyzing your X-ray</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generating model scores and attention heatmaps
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-primary">
              IN PROGRESS
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="X-ray analysis progress"
            aria-valuetext="Analysis in progress"
            className="analysis-progress-track"
          >
            <span aria-hidden="true" className="analysis-progress-indicator" />
          </div>
        </div>
      )}

      {progress === 100 && !isAnalyzing && analysisComplete && (
        <div role="status" aria-live="polite" className="mt-4 p-3 bg-green-500/10 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded-xl text-sm">
          Analysis complete.
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Finding = {
  label: string
  region: string
  confidence: number
  // Rectangle in percentage of the image's display box (0-100)
  x: number
  y: number
  w: number
  h: number
  delay: number
}

type XrayCase = {
  id: string
  src: string
  title: string
  subtitle: string
  findings: Finding[]
}

const cases: XrayCase[] = [
  {
    id: 'pneumonia-left-mid',
    src: '/xrays/lung.webp',
    title: 'Left mid-lobe consolidation',
    subtitle: 'Pattern consistent with bacterial pneumonia · 93% confidence',
    findings: [
      {
        // Highlighted region in the left mid lung (visible in lung.webp)
        label: 'Consolidation',
        region: 'Left mid-lobe',
        confidence: 93,
        x: 36,
        y: 34,
        w: 26,
        h: 22,
        delay: 350,
      },
      {
        // Secondary patch in the right lower lung
        label: 'Opacity',
        region: 'Right lower lobe',
        confidence: 78,
        x: 64,
        y: 58,
        w: 18,
        h: 16,
        delay: 900,
      },
    ],
  },
]

const INTERVAL_MS = 6000

export function XrayVisualizer() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (hovered || cases.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % cases.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [hovered])

  const activeCase = cases[activeIndex]

  return (
    <div
      className="xray-stage"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Animated chest X-ray analysis preview"
    >
      <div className="xray-frame">
        {/* Film header */}
        <div className="xray-frame-header">
          <span className="xray-tag">APEX-NET · AI PREVIEW</span>
          <span className="xray-tag xray-tag-soft">LIVE</span>
        </div>

        {/* Scan line sweep */}
        <div className="xray-scanline" aria-hidden />

        {/* Active X-ray image */}
        <div className="xray-image-wrap" key={activeCase.id}>
          <Image
            src={activeCase.src}
            alt={`Chest X-ray showing ${activeCase.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="xray-image"
            priority
          />

          {/* Detection overlays */}
          {activeCase.findings.map((f) => (
            <div
              key={f.label}
              className="xray-detect"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.w}%`,
                height: `${f.h}%`,
                animationDelay: `${f.delay}ms`,
              }}
            >
              <span className="xray-detect-corner xray-detect-corner-tl" />
              <span className="xray-detect-corner xray-detect-corner-tr" />
              <span className="xray-detect-corner xray-detect-corner-bl" />
              <span className="xray-detect-corner xray-detect-corner-br" />
              <span className="xray-detect-label">
                {f.label} · {f.confidence}%
              </span>
            </div>
          ))}
        </div>

        {/* Caption / readout */}
        <div className="xray-readout" key={`${activeCase.id}-r`}>
          <div className="xray-readout-title">{activeCase.title}</div>
          <div className="xray-readout-sub">{activeCase.subtitle}</div>
        </div>

        {/* Pagination dots */}
        {cases.length > 1 && (
          <div className="xray-dots">
            {cases.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`xray-dot ${i === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Show case ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
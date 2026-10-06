import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const xrayUploadId = formData.get('xrayUploadId')
    const image = formData.get('file')
    if (typeof xrayUploadId !== 'string' || !(image instanceof File)) {
      return NextResponse.json(
        { error: 'An uploaded X-ray file and upload ID are required' },
        { status: 400 },
      )
    }
    if (image.size === 0 || image.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Image must be non-empty and no larger than 10 MB' },
        { status: 413 },
      )
    }

    const configuredBackendUrl = process.env.APEX_BACKEND_URL?.trim()
    const backendUrl = (
      configuredBackendUrl ||
      (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : '')
    ).replace(/\/+$/, '')
    if (!backendUrl) {
      console.error('APEX_BACKEND_URL is not configured')
      return NextResponse.json(
        { error: 'APEX-Net backend is not configured on the server.' },
        { status: 500 },
      )
    }

    let parsedBackendUrl: URL
    try {
      parsedBackendUrl = new URL(backendUrl)
    } catch (error) {
      console.error('APEX_BACKEND_URL must be an absolute HTTP(S) URL:', error)
      return NextResponse.json(
        { error: 'APEX_BACKEND_URL must be set to the full backend URL, including https://.' },
        { status: 500 },
      )
    }
    if (
      (parsedBackendUrl.protocol !== 'https:' && parsedBackendUrl.protocol !== 'http:') ||
      parsedBackendUrl.search ||
      parsedBackendUrl.hash
    ) {
      console.error('APEX_BACKEND_URL must be an absolute HTTP(S) URL without query or fragment')
      return NextResponse.json(
        { error: 'APEX_BACKEND_URL must be set to the full backend URL, including https://.' },
        { status: 500 },
      )
    }

    const backendBaseUrl = parsedBackendUrl.toString().replace(/\/+$/, '')
    const backendForm = new FormData()
    backendForm.append('file', image, image.name)
    backendForm.append('heatmap_count', '3')

    const headers = new Headers()
    if (process.env.APEX_BACKEND_API_KEY) {
      headers.set('x-api-key', process.env.APEX_BACKEND_API_KEY)
    }

    let backendResponse: Response
    try {
      backendResponse = await fetch(`${backendBaseUrl}/predict`, {
        method: 'POST',
        headers,
        body: backendForm,
        cache: 'no-store',
      })
    } catch (error) {
      console.error('APEX-Net backend request failed:', error)
      return NextResponse.json(
        { error: 'APEX-Net backend is unreachable. Check APEX_BACKEND_URL and start the inference API.' },
        { status: 503 },
      )
    }

    const backendBody = await backendResponse.json().catch(() => null)
    if (!backendResponse.ok || !backendBody?.success || !backendBody?.prediction) {
      const detail =
        typeof backendBody?.detail === 'string'
          ? backendBody.detail
          : 'APEX-Net inference failed'
      return NextResponse.json({ error: detail }, { status: backendResponse.status || 502 })
    }

    const prediction = backendBody.prediction
    const { heatmaps, ...storedPrediction } = prediction
    if (xrayUploadId.startsWith('local-')) {
      return NextResponse.json({
        success: true,
        prediction: { id: `local-prediction-${Date.now()}`, ...prediction },
      })
    }

    const scores = prediction.findings.map(
      (finding: { confidence: number }) => finding.confidence,
    )
    const { data: saved, error: insertError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        xray_upload_id: xrayUploadId,
        prediction_data: storedPrediction,
        confidence_score: Math.max(...scores),
      })
      .select()
      .single()

    if (insertError) {
      console.warn('Prediction save skipped:', insertError.message)
      return NextResponse.json({
        success: true,
        prediction: { id: `local-prediction-${Date.now()}`, ...prediction },
        warning: 'Prediction completed, but it could not be saved to analysis history.',
      })
    }

    return NextResponse.json({
      success: true,
      prediction: { id: saved.id, ...prediction },
    })
  } catch (error) {
    console.error('Prediction request failed:', error)
    return NextResponse.json(
      { error: 'Unable to process this prediction request' },
      { status: 500 },
    )
  }
}

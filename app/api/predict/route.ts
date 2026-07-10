import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const xrayUploadId = formData.get('xrayUploadId') as string

    if (!file || !xrayUploadId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Mock prediction - Generate realistic chest X-ray analysis results
    const mockPrediction = {
      findings: [
        {
          label: 'Pneumonia',
          confidence: Math.random() * 0.3 + 0.2, // 20-50%
          severity: 'mild',
          location: 'right lower lobe'
        },
        {
          label: 'Atelectasis',
          confidence: Math.random() * 0.2 + 0.1, // 10-30%
          severity: 'minimal',
          location: 'bilateral'
        },
        {
          label: 'Consolidation',
          confidence: Math.random() * 0.15 + 0.05, // 5-20%
          severity: 'mild',
          location: 'right middle lobe'
        }
      ],
      overall_assessment: 'Mild findings consistent with possible viral infection. Recommend follow-up imaging in 2-4 weeks.',
      recommendations: [
        'Clinical correlation recommended',
        'Follow-up imaging in 2-4 weeks',
        'Consider chest CT if clinical status worsens'
      ],
      analysis_date: new Date().toISOString(),
      model_version: 'APEX-v2.1'
    }

    // Store prediction in database
    const { data: prediction, error: insertError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        xray_upload_id: xrayUploadId,
        prediction_data: mockPrediction,
        confidence_score: Math.max(...mockPrediction.findings.map(f => f.confidence)),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json({ error: 'Failed to store prediction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        ...mockPrediction
      }
    })
  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

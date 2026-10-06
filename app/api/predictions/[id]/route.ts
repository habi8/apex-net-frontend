import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, prediction_data')
      .maybeSingle()

    if (error) {
      console.error('Error deleting prediction:', error)
      return NextResponse.json({ error: 'Unable to delete this analysis' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const heatmapPaths = Object.values(data.prediction_data?.heatmaps ?? {})
      .filter(
        (path): path is string =>
          typeof path === 'string' && !path.startsWith('data:image/'),
      )
    if (heatmapPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('xray-uploads')
        .remove(heatmapPaths)
      if (storageError) {
        console.error('Unable to delete prediction heatmaps from storage:', storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prediction deletion failed:', error)
    return NextResponse.json(
      { error: 'Unable to delete this analysis' },
      { status: 500 },
    )
  }
}

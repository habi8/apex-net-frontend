import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const ids = body?.ids
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id: unknown) => typeof id !== 'string' || id.length === 0)
    ) {
      return NextResponse.json({ error: 'A non-empty list of analysis IDs is required' }, { status: 400 })
    }

    const uniqueIds = [...new Set(ids as string[])]
    const { data, error } = await supabase
      .from('predictions')
      .delete()
      .eq('user_id', user.id)
      .in('id', uniqueIds)
      .select('id, prediction_data')

    if (error) {
      console.error('Error deleting selected predictions:', error)
      return NextResponse.json({ error: 'Unable to delete selected analyses' }, { status: 500 })
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'No selected analyses were found' }, { status: 404 })
    }

    const heatmapPaths = data.flatMap((record) =>
      Object.values(record.prediction_data?.heatmaps ?? {}).filter(
        (path): path is string =>
          typeof path === 'string' && !path.startsWith('data:image/'),
      ),
    )
    if (heatmapPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('xray-uploads')
        .remove(heatmapPaths)
      if (storageError) {
        console.error('Unable to delete selected prediction heatmaps from storage:', storageError)
      }
    }

    return NextResponse.json({ success: true, deletedIds: data.map((record) => record.id) })
  } catch (error) {
    console.error('Bulk prediction deletion failed:', error)
    return NextResponse.json(
      { error: 'Unable to delete selected analyses' },
      { status: 500 },
    )
  }
}

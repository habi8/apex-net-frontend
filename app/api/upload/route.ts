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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Create a unique file path
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const buffer = await file.arrayBuffer()

    let storagePath = fileName
    let storageWarning: string | null = null

    // Upload to Supabase Storage when the bucket is configured. The app can
    // still run mock analysis if storage is not provisioned yet.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('xray-uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.warn('Storage upload skipped:', uploadError.message)
      storageWarning = uploadError.message
    } else {
      storagePath = uploadData.path
    }

    // Store upload metadata in database
    const { data: uploadRecord, error: insertError } = await supabase
      .from('xray_uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (insertError) {
      console.warn('Upload metadata save skipped:', insertError.message)
      return NextResponse.json({
        success: true,
        uploadId: `local-${Date.now()}`,
        fileName: file.name,
        warning: insertError.message,
      })
    }

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord.id,
      fileName: uploadRecord.file_name,
      warning: storageWarning,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

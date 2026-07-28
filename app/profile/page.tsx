'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppHeader } from '@/components/app-header'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setEmail(user.email || '')
      setFullName(user.user_metadata?.full_name || '')
    }

    checkAuth()
  }, [router])

  async function handleSaveProfile() {
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setIsSaving(false)
        return
      }

      setUser({
        ...user,
        user_metadata: { ...user.user_metadata, full_name: fullName }
      })

      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setIsEditing(false)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setIsDeleting(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        await supabase.auth.signOut()
        router.push('/auth/login')
        return
      }

      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AppHeader
        user={user}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/history', label: 'History' },
          { href: '/profile', label: 'Profile', active: true },
        ]}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border backdrop-blur-xl ${
              message.type === 'success'
                ? 'bg-green-50/80 border-green-300/60 text-green-700'
                : 'bg-red-50/80 border-red-300/60 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Account Information</h3>

          <div className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-foreground">{fullName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <p className="text-muted-foreground text-sm">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="glass-button-primary h-11 px-5 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFullName(user.user_metadata?.full_name || '')
                    }}
                    className="glass-button h-11 px-5 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-button h-11 px-5 rounded-xl text-sm font-semibold"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card-danger glass-card p-6">
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h3>

          <div className="space-y-4">
            <p className="text-foreground/80">
              Deleting your account will permanently remove all your data including upload history and analyses. This action cannot be undone.
            </p>

            {deleteConfirm === '' && (
              <button
                onClick={() => setDeleteConfirm('confirm')}
                className="glass-button-danger glass-button h-11 px-5 rounded-xl text-sm font-semibold"
              >
                Delete Account
              </button>
            )}

            {deleteConfirm === 'confirm' && (
              <div className="space-y-3 p-4 bg-white/60 border border-red-300/50 rounded-xl backdrop-blur-sm">
                <p className="text-foreground font-medium">
                  Type <span className="font-bold text-red-700">DELETE</span> to confirm account deletion:
                </p>
                <input
                  type="text"
                  value=""
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="glass-input glass-input-danger"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="glass-button-danger glass-button h-11 px-5 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm('')}
                    className="glass-button h-11 px-5 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
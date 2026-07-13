'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

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
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setIsSaving(false)
        return
      }

      // Update local user state
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
      
      // Delete user from auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        // Fallback: try to sign out and let backend handle deletion
        await supabase.auth.signOut()
        router.push('/auth/login')
        return
      }

      // Sign out after deletion
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b glass-nav shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <Logo size={156} />
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/history">
              <Button variant="outline" className="text-foreground border-border hover:bg-secondary">
                History
              </Button>
            </Link>
            <Button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
              className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Account Information</h3>

          <div className="space-y-6">
            {/* Full Name */}
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
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-foreground">{fullName || 'Not set'}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <p className="text-muted-foreground text-sm">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Edit/Save Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setFullName(user.user_metadata?.full_name || '')
                    }}
                    variant="outline"
                    className="text-foreground border-border hover:bg-secondary"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="text-foreground border-border hover:bg-secondary"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-red-900 mb-3">
                Deleting your account will permanently remove all your data including upload history and analyses. This action cannot be undone.
              </p>
            </div>

            {deleteConfirm === '' && !deleteConfirm && (
              <Button
                onClick={() => setDeleteConfirm('confirm')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            )}

            {deleteConfirm === 'confirm' && (
              <div className="space-y-3 p-4 bg-white border border-red-200 rounded-lg">
                <p className="text-red-900 font-medium">
                  Type <span className="font-bold">DELETE</span> to confirm account deletion:
                </p>
                <input
                  type="text"
                  value={deleteConfirm === 'confirm' ? '' : deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2 border border-red-200 rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm('')}
                    variant="outline"
                    className="text-foreground border-border hover:bg-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

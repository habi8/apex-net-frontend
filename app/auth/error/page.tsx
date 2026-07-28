'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 48 48" className="text-primary">
              <g fill="currentColor" fillOpacity="0.7">
                <path d="M24 8c-8 0-12 6-12 10v14c0 4 4 8 12 8s12-4 12-8V18c0-4-4-10-12-10z" />
                <path d="M18 18a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0" />
              </g>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">APEX-Net</h1>
          <p className="text-muted-foreground">AI-Powered Chest X-ray Analysis</p>
        </div>

        <div className="glass-card p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h2>
            <p className="text-muted-foreground mb-4">
              Something went wrong during authentication. Please try again.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <button className="glass-button-primary w-full h-11 rounded-xl text-sm font-semibold">
                Try Again
              </button>
            </Link>
            <Link href="/auth/sign-up" className="block">
              <button className="glass-button w-full h-11 rounded-xl text-sm font-semibold">
                Create New Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

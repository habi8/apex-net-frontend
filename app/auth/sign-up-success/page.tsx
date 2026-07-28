'use client'

import Link from 'next/link'

export default function SignUpSuccessPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-4">
              Check your email to confirm your account. Once confirmed, you can sign in and start analyzing X-rays.
            </p>
          </div>

          <Link href="/auth/login">
            <button className="glass-button-primary w-full h-11 rounded-xl text-sm font-semibold">
              Back to Sign In
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

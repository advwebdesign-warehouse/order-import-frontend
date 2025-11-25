//file path: src/app/verify-email/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com/api'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'code-entry'>('loading')
  const [message, setMessage] = useState('')
  const [code, setCode] = useState('')
  const [codeEmail, setCodeEmail] = useState(email || '')
  const [loading, setLoading] = useState(false)

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token) {
      verifyWithToken(token)
    } else if (email) {
      setStatus('code-entry')
    } else {
      setStatus('code-entry')
    }
  }, [token, email])

  async function verifyWithToken(verificationToken: string) {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')

        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  async function verifyWithCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: codeEmail, code })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')

        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      } else {
        setMessage(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setMessage('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    if (!codeEmail) {
      setMessage('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: codeEmail })
      })

      const data = await response.json()
      setMessage(data.message || 'Verification email sent!')
    } catch (error) {
      setMessage('Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  // Loading state (verifying token)
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Verifying your email...</h2>
          <p className="text-gray-600 mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to sign in...</p>
            <Link
              href="/sign-in"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => setStatus('code-entry')}
                className="w-full bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700"
              >
                Enter Code Manually
              </button>
              <Link
                href="/sign-in"
                className="block text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Code entry state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="text-gray-600 mt-2">Enter the 6-digit code sent to your email</p>
          </div>

          <form onSubmit={verifyWithCode} className="space-y-6">
            {!email && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={codeEmail}
                  onChange={(e) => setCodeEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="000000"
              />
            </div>

            {message && (
              <div className={`rounded-md p-4 ${message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={resendCode}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
            >
              Didn't receive the code? Resend
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

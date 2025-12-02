//file path: src/app/sign-up/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gravityhub.co/api'
const IS_DEV = process.env.NODE_ENV === 'development'

// ✅ Eye icon component
const EyeIcon = ({ show }: { show: boolean }) => (
  show ? (
    // Eye-off icon (hide password)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    // Eye icon (show password)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
)

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showVerificationSent, setShowVerificationSent] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorDetails(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      console.log('[Sign Up] 🔷 Creating account...')
      console.log('[Sign Up] API URL:', API_URL)

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          companyName: formData.companyName
        })
      })

      console.log('[Sign Up] Response status:', response.status)

      let data
      try {
        data = await response.json()
        console.log('[Sign Up] Response data:', data)
      } catch (parseError) {
        console.error('[Sign Up] Failed to parse JSON response:', parseError)
        const textResponse = await response.text()
        console.error('[Sign Up] Raw response:', textResponse)
        setError('Server returned invalid response')
        setErrorDetails({
          status: response.status,
          rawResponse: textResponse.substring(0, 500)
        })
        setLoading(false)
        return
      }

      if (response.ok) {
        console.log('[Sign Up] ✅ Account created, verification email sent')
        setShowVerificationSent(true)
      } else {
        console.error('[Sign Up] ❌ Registration failed:', data)

        // Set user-friendly error message
        setError(data.error || 'Registration failed')

        // ✅ In development, show detailed error info
        if (IS_DEV && data.details) {
          setErrorDetails({
            message: data.error,
            details: data.details,
            step: data.step,
            status: response.status
          })
        }
      }

    } catch (error: any) {
      console.error('[Sign Up] ❌ Network/Fetch error:', error)

      // Check if it's a network error
      if (error.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please check if the API is running.')
        if (IS_DEV) {
          setErrorDetails({
            type: 'Network Error',
            message: 'Failed to fetch',
            apiUrl: API_URL,
            hint: 'Make sure the backend server is running'
          })
        }
      } else {
        setError('Registration failed. Please try again.')
        if (IS_DEV) {
          setErrorDetails({
            type: error.constructor.name,
            message: error.message,
            stack: error.stack
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ Show verification email sent screen
  if (showVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h2>

            <p className="text-gray-600 mb-4">
              We've sent a verification email to:
            </p>

            <p className="text-lg font-medium text-indigo-600 mb-6">
              {formData.email}
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email or enter the 6-digit code to verify your account.
            </p>

            <div className="space-y-3">
              <Link
                href={`/verify-email?email=${encodeURIComponent(formData.email)}`}
                className="block w-full bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 text-center"
              >
                Enter Verification Code
              </Link>

              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleSubmit}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  resend it
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="My Company"
                value={formData.companyName}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">  {/* ✅ Added relative wrapper */}
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder=""
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">  {/* ✅ Added relative wrapper */}
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder=""
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <EyeIcon show={showConfirmPassword} />
              </button>
              </div>
            </div>
          </div>

          {/* ✅ Enhanced error display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>

                  {/* ✅ Show detailed error info in development */}
                  {IS_DEV && errorDetails && (
                    <div className="mt-2 text-xs text-red-700">
                      <details className="cursor-pointer">
                        <summary className="font-semibold">Debug Information (Dev Only)</summary>
                        <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-64">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
          </div>
        </form>
      </div>
    </div>
  )
}

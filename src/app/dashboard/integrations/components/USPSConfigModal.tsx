//file path: src/app/dashboard/integrations/components/USPSConfigModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { USPSIntegration, Environment } from '../types/integrationTypes'

interface USPSConfigModalProps {
  isOpen: boolean
  onClose: () => void
  integration: USPSIntegration
  onSave: (integrationId: string, config: any) => void
}

export default function USPSConfigModal({
  isOpen,
  onClose,
  integration,
  onSave
}: USPSConfigModalProps) {
  const [config, setConfig] = useState({
    consumerKey: integration.config?.consumerKey || '',
    consumerSecret: integration.config?.consumerSecret || '',
    environment: integration.config?.environment || 'sandbox' as Environment,
    apiUrl: integration.config?.apiUrl || 'https://api-cat.usps.com'
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false) // New state for collapsible

  const handleEnvironmentChange = (env: Environment) => {
    setConfig({
      ...config,
      environment: env,
      apiUrl: env === 'sandbox'
        ? 'https://apis-tem.usps.com'  // ← CORRECTED
        : 'https://apis.usps.com'       // ← CORRECTED
    })
  }

  const [syncing, setSyncing] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/usps/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Connection successful! Your USPS credentials are valid.'
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check your credentials.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error. Please try again.'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSyncing(true)

    try {
      // Save the configuration first
      onSave(integration.id, config)

      // Check if USPS boxes already exist
      const existingBoxes = localStorage.getItem('shipping_boxes')
      const parsed = existingBoxes ? JSON.parse(existingBoxes) : []
      const hasUSPSBoxes = parsed.some((box: any) => box.boxType === 'usps')

      // Only auto-sync if no USPS boxes exist yet (first time setup)
      if (!hasUSPSBoxes) {
        console.log('First time setup - auto-syncing USPS boxes...')

        const response = await fetch('/api/shipping/boxes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carriers: ['USPS'],
            credentials: {
              consumerKey: config.consumerKey,
              consumerSecret: config.consumerSecret,
              environment: config.environment,
              apiUrl: config.apiUrl
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Auto-synced ${data.count} USPS boxes`)

          // Store boxes in localStorage
          if (data.boxes && data.boxes.length > 0) {
            // Keep custom boxes, add new USPS boxes
            const customBoxes = parsed.filter((box: any) => box.boxType === 'custom')
            const updated = [...customBoxes, ...data.boxes]

            localStorage.setItem('shipping_boxes', JSON.stringify(updated))
            console.log('✅ Boxes stored in localStorage')
          }
        } else {
          console.warn('Failed to auto-sync boxes:', await response.text())
        }
      } else {
        console.log('USPS boxes already exist - skipping auto-sync. Use "Sync from API" button to refresh.')
      }
    } catch (error) {
      console.error('Error auto-syncing boxes:', error)
    } finally {
      setSyncing(false)
      onClose()
    }
  }

  const isConfigValid =
    (config.consumerKey?.trim().length ?? 0) > 0 &&
    (config.consumerSecret?.trim().length ?? 0) > 0

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">📮</span>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Configure USPS Integration
                        </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
                  {/* Pending Approval Warning */}
                  {testResult && !testResult.success && testResult.message?.includes('Pending') && (
                    <div className="rounded-md bg-orange-50 border-2 border-orange-200 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-orange-800">
                            ⏳ App Approval Pending
                          </h3>
                          <div className="mt-2 text-sm text-orange-700">
                            <p className="font-medium mb-2">Your USPS app is awaiting approval (typical wait: 1-48 hours)</p>
                            <div className="space-y-1">
                              <p>✓ Your credentials are saved and ready</p>
                              <p>✓ Check your email for approval notification</p>
                              <p>✓ Monitor status at <a href="https://verified.usps.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">USPS Developer Portal</a></p>
                              <p>✓ Once status changes to "Accepted", test connection again</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Banner - Now Collapsible */}
                  <div className="rounded-md bg-blue-50 border border-blue-200">
                    {/* Clickable Header */}
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-md"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3" />
                        <h3 className="text-sm font-medium text-blue-800">
                          Getting Started with USPS Developer Portal
                        </h3>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
                          showInstructions ? 'transform rotate-0' : 'transform -rotate-90'
                        }`}
                      />
                    </button>

                    {/* Collapsible Content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showInstructions ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4">
                        <div className="text-sm text-blue-700 space-y-3">
                          <div>
                            <p className="font-medium mb-1">Step 1: Create or sign in</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Go to <a href="https://cop.usps.com/cop-navigator?wf=API&showCC=false" target="_blank" rel="noopener noreferrer" className="underline font-medium">Customer Onboarding Portal</a></li>
                              <li>Create New Account or Sign in</li>
                              <li>Complete your business account setup if needed</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-medium mb-1">Step 2: Connect with USPS API</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Click on <strong>"Enroll in SHIP/USPS APIs"</strong> button</li>
                              <li>Click on <strong>"Ship with APIs"</strong></li>
                              <li>Click <strong>"Add App"</strong> button</li>
                              <li>Enter App Name: "Order Management System"</li>
                              <li>Enter Callback URL: <code className="bg-white px-1 rounded text-xs font-mono">https://orders-warehouse.adv.design/api/auth/usps/callback</code></li>
                              <li>Select <strong>"Public Access I - quota (60 request per hour)"</strong></li>
                              <li>Accept Terms and Conditions</li>
                              <li>Click <strong>"Add App"</strong></li>
                              <li>Click <strong>"Request Mailer ID"</strong></li>
                              <li>Select <strong>Associate new Mailer ID to a CRID</strong></li>
                              <li>Select <strong>Select Enterprise Payment Account</strong></li>
                              <li>Under Request Mailer IDs check the 2 checkbox "Outbound" and "Returns"</li>
                              <li>Click <strong>"Request Mailer ID"</strong> button</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-medium mb-1">Step 3: Get Your Credentials</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Find your app in the Developer Portal</li>
                              <li>Copy your <strong>Consumer Key</strong></li>
                              <li>Copy your <strong>Consumer Secret</strong></li>
                              <li>Enter them in the fields below</li>
                              <li>Click "Test Connection" to verify (after approval)</li>
                              <li>Click "Save Configuration"</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environment Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Environment
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('sandbox')}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                          config.environment === 'sandbox'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${
                          config.environment === 'sandbox' ? 'opacity-100' : 'opacity-50'
                        }`}>
                          🧪
                        </div>
                        <div className="text-sm font-medium text-gray-900">Sandbox (CAT)</div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          Customer Acceptance Testing
                        </div>
                        {config.environment === 'sandbox' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('production')}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                          config.environment === 'production'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${
                          config.environment === 'production' ? 'opacity-100' : 'opacity-50'
                        }`}>
                          🚀
                        </div>
                        <div className="text-sm font-medium text-gray-900">Production</div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          Live shipping & billing
                        </div>
                        {config.environment === 'production' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Consumer Key */}
                  <div>
                    <label htmlFor="consumerKey" className="block text-sm font-medium text-gray-700 mb-1">
                      Consumer Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="consumerKey"
                      value={config.consumerKey}
                      onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                      placeholder="Enter your USPS Consumer Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Found in your USPS Developer Portal under "Apps"
                    </p>
                  </div>

                  {/* Consumer Secret */}
                  <div>
                    <label htmlFor="consumerSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      Consumer Secret <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        id="consumerSecret"
                        value={config.consumerSecret}
                        onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                        placeholder="Enter your USPS Consumer Secret"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Keep this secret secure - treat it like a password
                    </p>
                  </div>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`rounded-md p-4 ${
                      testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '✓ ' : '✗ '}
                        {testResult.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                    <button
                      onClick={handleTest}
                      disabled={!isConfigValid || testing}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testing ? 'Testing Connection...' : 'Test Connection'}
                    </button>

                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!isConfigValid}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syncing ? 'Saving & Syncing Boxes...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

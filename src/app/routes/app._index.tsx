//file path: app/routes/app._index.tsx

'use client'

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Welcome Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              Your store is connected and ready to go.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <a
              href="https://advorderflow.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Open Warehouse Dashboard
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          {/* Additional Info (Optional) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                    Connected
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Integration</div>
                <div className="text-sm text-gray-900">Shopify</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Sync Status</div>
                <div className="text-sm text-gray-900">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

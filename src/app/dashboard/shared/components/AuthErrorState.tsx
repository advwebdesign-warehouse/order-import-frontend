//file path: app/dashboard/shared/components/AuthErrorState.tsx

interface AuthErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/**
 * Reusable error state component shown when authentication fails
 * Used across all dashboard pages
 */
export function AuthErrorState({
  title = "Unable to load account",
  message = "Please try refreshing the page or contact support if the issue persists.",
  onRetry = () => window.location.reload()
}: AuthErrorStateProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
          <div className="mt-6">
            <button
              onClick={onRetry}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

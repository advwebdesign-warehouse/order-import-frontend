//file path: app/dashboard/shared/components/AuthLoadingState.tsx

interface AuthLoadingStateProps {
  message?: string
}

/**
 * Reusable loading state component shown while verifying authentication
 * Used across all dashboard pages
 */
export function AuthLoadingState({
  message = "Loading account information..."
}: AuthLoadingStateProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    </div>
  )
}

//file path: app/dashboard/shared/components/withAuth.tsx

'use client'

import { ComponentType } from 'react'
import { useCurrentAccountId } from '@/hooks/useAccountInitialization'
import { AuthLoadingState } from './AuthLoadingState'
import { AuthErrorState } from './AuthErrorState'

interface WithAuthProps {
  accountId: string
}

/**
 * Higher-Order Component (HOC) that wraps dashboard pages with authentication
 *
 * Benefits:
 * - DRY: No need to repeat auth logic in every page
 * - Consistent: Same loading/error states across all pages
 * - Type-safe: Guarantees accountId is always valid
 * - Maintainable: Update auth logic in one place
 *
 * Usage:
 *
 * // Before:
 * export default function ProductsPage() {
 *   const { accountId, loading } = useCurrentAccountId()
 *   if (loading) return <Loading />
 *   if (!accountId) return <Error />
 *   return <ProductsPageContent accountId={accountId} />
 * }
 *
 * // After:
 * function ProductsPageContent({ accountId }: WithAuthProps) {
 *   // Your page content here
 *   // accountId is guaranteed to be valid
 * }
 *
 * export default withAuth(ProductsPageContent)
 *
 * // With custom messages:
 * export default withAuth(ProductsPageContent, {
 *   loadingMessage: "Loading products...",
 *   errorTitle: "Unable to load products",
 *   errorMessage: "Please check your connection and try again."
 * })
 */

interface WithAuthOptions {
  loadingMessage?: string
  errorTitle?: string
  errorMessage?: string
}

export function withAuth<P extends WithAuthProps>(
  Component: ComponentType<P>,
  options?: WithAuthOptions
) {
  return function WithAuthComponent(props: Omit<P, 'accountId'>) {
    const { accountId, loading } = useCurrentAccountId()

    // Show loading state while verifying authentication
    if (loading) {
      return <AuthLoadingState message={options?.loadingMessage} />
    }

    // Show error state if authentication failed
    if (!accountId) {
      return (
        <AuthErrorState
          title={options?.errorTitle}
          message={options?.errorMessage}
        />
      )
    }

    // Authentication verified - render the wrapped component
    return <Component {...(props as P)} accountId={accountId} />
  }
}

// File: app/dashboard/providers.tsx

'use client'

import { WarehouseProvider } from './warehouses/context/WarehouseContext'

interface DashboardProvidersProps {
  children: React.ReactNode
}

export default function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <WarehouseProvider>
      {children}
    </WarehouseProvider>
  )
}

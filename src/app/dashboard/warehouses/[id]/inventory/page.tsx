'use client'

import { use } from 'react'

interface WarehouseInventoryPageProps {
  params: Promise<{ id: string }>
}

export default function WarehouseInventoryPage({ params }: WarehouseInventoryPageProps) {
  const resolvedParams = use(params)
  const warehouseId = resolvedParams.id

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold leading-6 text-gray-900">
        Warehouse Inventory
      </h1>
      <p className="mt-2 text-sm text-gray-700">
        Manage inventory for warehouse {warehouseId}
      </p>
      {/* Add inventory management components here */}
    </div>
  )
}

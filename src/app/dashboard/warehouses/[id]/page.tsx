'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useWarehouses } from '../hooks/useWarehouses'
import { Warehouse } from '../utils/warehouseTypes'

export default function WarehousePage() {
  const params = useParams()
  const warehouseId = params.id as string
  const { warehouses, loading } = useWarehouses()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)

  useEffect(() => {
    if (warehouses.length > 0) {
      const foundWarehouse = warehouses.find(w => w.id === warehouseId)
      setWarehouse(foundWarehouse || null)
    }
  }, [warehouses, warehouseId])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Warehouse Not Found</h2>
        <p className="mt-2 text-gray-600">The warehouse you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            {warehouse.name}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {warehouse.description || `Manage ${warehouse.name} operations and inventory.`}
          </p>
        </div>
      </div>

      {/* Warehouse content - you can expand this */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Warehouse Details</h3>
          <dl className="mt-4 space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Code</dt>
              <dd className="text-sm text-gray-900">{warehouse.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 capitalize">{warehouse.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Product Count</dt>
              <dd className="text-sm text-gray-900">{warehouse.productCount || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Address</h3>
          <div className="mt-4 text-sm text-gray-900">
            <p>{warehouse.address.address1}</p>
            {warehouse.address.address2 && <p>{warehouse.address.address2}</p>}
            <p>{warehouse.address.city}, {warehouse.address.state} {warehouse.address.zip}</p>
            <p>{warehouse.address.country}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Contact Info</h3>
          <dl className="mt-4 space-y-2">
            {warehouse.contactInfo.managerName && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Manager</dt>
                <dd className="text-sm text-gray-900">{warehouse.contactInfo.managerName}</dd>
              </div>
            )}
            {warehouse.contactInfo.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">{warehouse.contactInfo.phone}</dd>
              </div>
            )}
            {warehouse.contactInfo.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{warehouse.contactInfo.email}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

//file path: app/dashboard/warehouses/components/WarehousesTable.tsx

'use client'

import React from 'react'
import Link from 'next/link'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BuildingOffice2Icon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import ReactCountryFlag from "react-country-flag"

import { Warehouse, WarehouseColumnConfig, WarehouseSortState, LinkedIntegration } from '../utils/warehouseTypes'

interface WarehousesTableProps {
  warehouses: Warehouse[]
  columns: WarehouseColumnConfig[]
  sortConfig: WarehouseSortState
  selectedWarehouses: Set<string>
  onSort: (field: string) => void
  onSelectWarehouse: (warehouseId: string) => void
  onSelectAll: () => void
  onViewWarehouse: (warehouse: Warehouse) => void
  onEditWarehouse: (warehouse: Warehouse) => void
  onDeleteWarehouse: (warehouse: Warehouse) => void
  onSetDefaultWarehouse: (warehouse: Warehouse) => void
}

export default function WarehousesTable({
  warehouses,
  columns,
  sortConfig,
  selectedWarehouses,
  onSort,
  onSelectWarehouse,
  onSelectAll,
  onViewWarehouse,
  onEditWarehouse,
  onDeleteWarehouse,
  onSetDefaultWarehouse
}: WarehousesTableProps) {

  const CountryFlag = ({ countryCode }: { countryCode: string }) => (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: '24px',
        height: '16px',
      }}
      title={countryCode}
    />
  )

  const StatusBadge = ({ status }: { status: string }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status}
      </span>
    )
  }

  // ✅ NEW: Render integration badges with links
  const IntegrationBadge = ({ integration }: { integration: LinkedIntegration }) => {
    const linkTypeColors = {
      primary: 'bg-blue-100 text-blue-800 border-blue-200',
      fallback: 'bg-orange-100 text-orange-800 border-orange-200',
      assigned: 'bg-purple-100 text-purple-800 border-purple-200',
      single: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    }

    const linkTypeLabels = {
      primary: 'Primary',
      fallback: 'Fallback',
      assigned: 'Assigned',
      single: 'Active',
    }

    return (
      <Link
        href={`/dashboard/integrations?id=${integration.id}`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:shadow-sm ${linkTypeColors[integration.linkType]}`}
        title={`${integration.name} - ${linkTypeLabels[integration.linkType]}`}
      >
        <LinkIcon className="h-3 w-3" />
        <span>{integration.name}</span>
        {integration.linkType !== 'single' && (
          <span className="text-[10px] opacity-75">({linkTypeLabels[integration.linkType]})</span>
        )}
      </Link>
    )
  }

  const renderSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return (
        <div className="flex flex-col">
          <ChevronUpIcon className="h-3 w-3 text-gray-300" />
          <ChevronDownIcon className="h-3 w-3 -mt-1 text-gray-300" />
        </div>
      )
    }

    return (
      <div className="flex flex-col">
        <ChevronUpIcon
          className={`h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-indigo-600' : 'text-gray-300'}`}
        />
        <ChevronDownIcon
          className={`h-3 w-3 -mt-1 ${sortConfig.direction === 'desc' ? 'text-indigo-600' : 'text-gray-300'}`}
        />
      </div>
    )
  }

  const renderCellContent = (column: WarehouseColumnConfig, warehouse: Warehouse) => {
    switch (column.field) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={selectedWarehouses.has(warehouse.id)}
            onChange={() => onSelectWarehouse(warehouse.id)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        )

      case 'isDefault':
        return (
          <button
            onClick={() => onSetDefaultWarehouse(warehouse)}
            disabled={warehouse.isDefault}
            className={`${warehouse.isDefault ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
            title={warehouse.isDefault ? 'Default warehouse' : 'Set as default warehouse'}
          >
            {warehouse.isDefault ? (
              <StarIconSolid className="h-5 w-5" />
            ) : (
              <StarIcon className="h-5 w-5" />
            )}
          </button>
        )

      case 'name':
        return (
          <div>
            <div className="flex items-center">
              <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <div>
                <button
                  onClick={() => onViewWarehouse(warehouse)}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer text-left"
                >
                  {warehouse.name}
                </button>
                {warehouse.code && (
                  <div className="text-sm text-gray-500 font-mono">
                    {warehouse.code}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'address':
        return (
          <div className="text-sm text-gray-900">
            <div className="flex items-center mb-1">
              <CountryFlag countryCode={warehouse.address.countryCode} />
              <span className="ml-2">{warehouse.address.city}, {warehouse.address.state}</span>
            </div>
            <div className="text-gray-500">
              {warehouse.address.address1}
            </div>
          </div>
        )

      case 'status':
        return <StatusBadge status={warehouse.status} />

        // ✅ NEW: Render integrations column
        case 'integrations':
          const linkedIntegrations = warehouse.linkedIntegrations || []

          if (linkedIntegrations.length === 0) {
            return (
              <span className="text-sm text-gray-400 italic">No integrations</span>
            )
          }

          return (
            <div className="flex flex-wrap gap-1">
              {linkedIntegrations.slice(0, 3).map(integration => (
                <IntegrationBadge key={integration.id} integration={integration} />
              ))}
              {linkedIntegrations.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  +{linkedIntegrations.length - 3} more
                </span>
              )}
            </div>
          )

      case 'productCount':
        return (
          <div className="text-sm text-gray-900">
            <span className="font-medium">{warehouse.productCount || 0}</span>
            <span className="text-gray-500 ml-1">products</span>
          </div>
        )

      case 'contact':
        return (
          <div className="text-sm text-gray-900">
            {warehouse.contactInfo.managerName && (
              <div className="font-medium">{warehouse.contactInfo.managerName}</div>
            )}
            {warehouse.contactInfo.phone && (
              <div className="text-gray-500">{warehouse.contactInfo.phone}</div>
            )}
            {warehouse.contactInfo.email && (
              <div className="text-gray-500">{warehouse.contactInfo.email}</div>
            )}
            {!warehouse.contactInfo.managerName && !warehouse.contactInfo.phone && !warehouse.contactInfo.email && (
              <span className="text-gray-400">-</span>
            )}
          </div>
        )

      case 'updatedAt':
        return (
          <div className="text-sm text-gray-700">
            {new Date(warehouse.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        )

      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewWarehouse(warehouse)}
              className="text-indigo-600 hover:text-indigo-900"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditWarehouse(warehouse)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Warehouse"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {!warehouse.isDefault && (
              <button
                onClick={() => onDeleteWarehouse(warehouse)}
                className="text-red-600 hover:text-red-900"
                title="Delete Warehouse"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {columns.filter(col => col.visible).map((column) => (
                    <th
                      key={column.id}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => column.sortable && onSort(column.field)}
                    >
                      <div className="flex items-center space-x-1">
                        {column.field === 'select' ? (
                          <input
                            type="checkbox"
                            checked={warehouses.length > 0 && selectedWarehouses.size === warehouses.length}
                            onChange={onSelectAll}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            title="Select all warehouses on this page"
                          />
                        ) : (
                          <>
                            <span>{column.label}</span>
                            {column.sortable && renderSortIcon(column.field)}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr
                    key={warehouse.id}
                    className={`hover:bg-gray-50 ${warehouse.isDefault ? 'bg-yellow-50' : ''}`}
                  >
                    {columns.filter(col => col.visible).map((column) => (
                      <td key={`${warehouse.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(column, warehouse)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {warehouses.length === 0 && (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first warehouse.</p>
        </div>
      )}
    </div>
  )
}

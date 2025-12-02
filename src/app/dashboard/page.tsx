//File: app/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useAccountInitialization } from '@/hooks/useAccountInitialization'  // ✅ Added import
import { AccountAPI } from '@/lib/api/accountApi'  // ✅ Added import

interface OptimizationItem {
  id: string
  category: string
  question: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  notes: string
}

const OPTIMIZATION_ITEMS: OptimizationItem[] = [
  {
    id: 'warehouse-layout',
    category: 'Layout & Zones',
    question: 'Warehouse layout - Do you have defined zones/aisles?',
    description: 'Map out picking zones, aisles, and bin locations for route optimization',
    status: 'not-started',
    priority: 'high',
    notes: ''
  },
  {
    id: 'picking-method',
    category: 'Picking Strategy',
    question: 'Picking method - Individual order picking or batch picking?',
    description: 'Determine if pickers handle one order at a time or group multiple orders',
    status: 'not-started',
    priority: 'high',
    notes: ''
  },
  {
    id: 'technology',
    category: 'Technology',
    question: 'Technology - Handheld scanners, tablets, or paper lists?',
    description: 'Choose picking technology stack and integration requirements',
    status: 'not-started',
    priority: 'medium',
    notes: ''
  },
  {
    id: 'item-types',
    category: 'Inventory',
    question: 'Item types - Are there special handling requirements?',
    description: 'Identify fragile, hazmat, cold storage, or other special handling items',
    status: 'not-started',
    priority: 'medium',
    notes: ''
  },
  {
    id: 'team-size',
    category: 'Operations',
    question: 'Team size - Multiple pickers working simultaneously?',
    description: 'Plan for concurrent picker workflows and task distribution',
    status: 'not-started',
    priority: 'medium',
    notes: ''
  },
  {
    id: 'route-optimization',
    category: 'Efficiency',
    question: 'Route optimization - Pick path sequencing by location?',
    description: 'Sort items by warehouse zones/aisles for efficient routing (A1 → A5 → B2)',
    status: 'not-started',
    priority: 'high',
    notes: ''
  },
  {
    id: 'batch-capability',
    category: 'Efficiency',
    question: 'Batch picking - Pick item X for multiple orders simultaneously?',
    description: 'Enable picking the same item for multiple orders in one trip',
    status: 'not-started',
    priority: 'medium',
    notes: ''
  },
  {
    id: 'error-prevention',
    category: 'Quality',
    question: 'Error prevention - Product images and scan verification?',
    description: 'Add product images, barcode scanning, and bin location confirmation',
    status: 'not-started',
    priority: 'high',
    notes: ''
  },
  {
    id: 'progress-tracking',
    category: 'User Experience',
    question: 'Progress tracking - Show completion status and estimated time?',
    description: 'Display progress indicators and time estimates for pickers',
    status: 'not-started',
    priority: 'low',
    notes: ''
  }
]

export default function Dashboard() {
  const router = useRouter()

  // ✅ Use new httpOnly cookie auth via hook
  const { isValidating, user, account } = useAccountInitialization()

  const [optimizationItems, setOptimizationItems] = useState<OptimizationItem[]>(OPTIMIZATION_ITEMS)
  const [selectedItem, setSelectedItem] = useState<OptimizationItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    // Load saved optimization progress from localStorage
    const savedItems = localStorage.getItem('warehouseOptimization')
    if (savedItems) {
      setOptimizationItems(JSON.parse(savedItems))
    }
  }, [])

  // ✅ Sign out using httpOnly cookie API
  const handleSignOut = async () => {
    try {
      await AccountAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push('/sign-in')  // ✅ Correct path
  }

  const updateItem = (id: string, updates: Partial<OptimizationItem>) => {
    const updatedItems = optimizationItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    setOptimizationItems(updatedItems)
    localStorage.setItem('warehouseOptimization', JSON.stringify(updatedItems))
  }

  const handleEditItem = (item: OptimizationItem) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleSaveItem = (updates: Partial<OptimizationItem>) => {
    if (selectedItem) {
      updateItem(selectedItem.id, updates)
      setShowEditModal(false)
      setSelectedItem(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const completedItems = optimizationItems.filter(item => item.status === 'completed').length
  const totalItems = optimizationItems.length
  const progressPercentage = Math.round((completedItems / totalItems) * 100)

  // ✅ Show loading while validating session
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ Hook handles redirect if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Welcome Section */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome, {user.name}!
                </h1>
                <p className="text-gray-600 mb-2">Email: {user.email}</p>
                <p className="text-gray-600 mb-6">Role: {user.role}</p>

                <p className="text-gray-600 mb-4">
                  Your order import platform is ready! This is where you'll see your orders and manage integrations.
                </p>

                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Warehouse Optimization Tracker */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Warehouse Optimization Tracker</h2>
                    <p className="text-sm text-gray-600">Track picking system setup and optimization progress</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{progressPercentage}%</div>
                    <div className="text-sm text-gray-500">{completedItems} of {totalItems} completed</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                {/* Optimization Items List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {optimizationItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(item.status)}
                            <span className="text-xs font-medium text-gray-500">{item.category}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">{item.question}</h3>
                          <p className="text-xs text-gray-600">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-blue-600 mt-1 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Optimization Item</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  defaultValue={selectedItem.status}
                  onChange={(e) => setSelectedItem({...selectedItem, status: e.target.value as any})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  defaultValue={selectedItem.priority}
                  onChange={(e) => setSelectedItem({...selectedItem, priority: e.target.value as any})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  defaultValue={selectedItem.notes}
                  onChange={(e) => setSelectedItem({...selectedItem, notes: e.target.value})}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Add notes about implementation, decisions, or next steps..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveItem(selectedItem)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

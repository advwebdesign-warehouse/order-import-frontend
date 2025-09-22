//file path: app/dashboard/layout.tsx
'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useWarehouses } from './warehouses/context/WarehouseContext'
import DashboardProviders from './providers'

// Navigation item interface
interface NavigationItem {
  name: string
  href?: string
  icon: any
  expandable?: boolean
  children?: NavigationItem[]
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['warehouses']))
  const pathname = usePathname()
  const { warehouses, loading } = useWarehouses()

  // Add warehouse names to expanded items when warehouses are loaded
  useEffect(() => {
    if (warehouses.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = new Set(prev)
        warehouses.forEach(warehouse => {
          newExpanded.add(warehouse.name.toLowerCase())
        })
        return newExpanded
      })
    }
  }, [warehouses])

  const toggleExpanded = (itemName: string) => {
    // Prevent warehouses and individual warehouse items from being collapsed
    if (itemName.toLowerCase() === 'warehouses' ||
        warehouses.some(w => w.name.toLowerCase() === itemName.toLowerCase())) {
      return
    }

    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  const isCurrentPage = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Build navigation with dynamic warehouse submenu
  const buildNavigation = (): NavigationItem[] => {
    const baseNavigation: NavigationItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
    ]

    // Handle warehouses navigation - always clickable and expandable
    const warehouseChildren: NavigationItem[] = []

    if (warehouses.length === 1) {
      // Single warehouse - show layout and orders
      const warehouse = warehouses[0]
      warehouseChildren.push(
        {
          name: 'Layout',
          href: `/dashboard/warehouses/${warehouse.id}/layout`,
          icon: Squares2X2Icon,
        },
        {
          name: 'Orders',
          href: `/dashboard/warehouses/${warehouse.id}/orders`,
          icon: ShoppingBagIcon,
        },
        {
          name: 'Add Warehouse',
          href: '/dashboard/warehouses?action=add',
          icon: PlusIcon,
        }
      )
    } else if (warehouses.length > 1) {
      // Multiple warehouses - show each warehouse with layout and orders
      warehouseChildren.push(
        ...warehouses
          .filter(w => w.status === 'active')
          .map(warehouse => ({
            name: warehouse.name,
            href: `/dashboard/warehouses/${warehouse.id}`, // Make warehouse clickable (goes to overview)
            icon: BuildingOffice2Icon,
            expandable: true,
            children: [
              {
                name: 'Layout',
                href: `/dashboard/warehouses/${warehouse.id}/layout`,
                icon: Squares2X2Icon,
              },
              {
                name: 'Orders',
                href: `/dashboard/warehouses/${warehouse.id}/orders`,
                icon: ShoppingBagIcon,
              }
            ]
          })),
        {
          name: 'Add Warehouse',
          href: '/dashboard/warehouses?action=add',
          icon: PlusIcon,
        }
      )
    } else {
      // No warehouses - still show Add Warehouse option
      warehouseChildren.push({
        name: 'Add Warehouse',
        href: '/dashboard/warehouses?action=add',
        icon: PlusIcon,
      })
    }

    // Always make Warehouses clickable (goes to main warehouses page) and expandable
    baseNavigation.push({
      name: 'Warehouses',
      href: '/dashboard/warehouses', // Main warehouses page (formerly "All Warehouses")
      icon: BuildingOffice2Icon,
      expandable: warehouseChildren.length > 0,
      children: warehouseChildren,
    })

    baseNavigation.push(
      { name: 'Integrations', href: '/dashboard/integrations', icon: Cog6ToothIcon },
      { name: 'Settings', href: '/dashboard/settings', icon: WrenchScrewdriverIcon }
    )

    return baseNavigation
  }

  const navigation = buildNavigation()

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.name.toLowerCase())
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href ? isCurrentPage(item.href) : false
    const hasActiveChild = hasChildren && item.children!.some(child =>
      child.href ? isCurrentPage(child.href) : child.children?.some(grandchild =>
        grandchild.href ? isCurrentPage(grandchild.href) : false
      )
    )

    const paddingLeft = level === 0 ? 'pl-3' : level === 1 ? 'pl-8' : 'pl-12'

    return (
      <div key={item.name}>
        <div
          className={`${paddingLeft} pr-3 py-2 flex items-center justify-between group cursor-pointer hover:bg-gray-100 ${
            isActive || hasActiveChild ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
          }`}
          onClick={() => {
            // Handle click for expandable items
            const isWarehouse = warehouses.some(w => w.name.toLowerCase() === item.name.toLowerCase())
            if (hasChildren && item.name.toLowerCase() !== 'warehouses' && !isWarehouse) {
              toggleExpanded(item.name.toLowerCase())
            } else if (item.href) {
              setSidebarOpen(false)
            }
          }}
        >
          {item.href ? (
            <Link href={item.href} className="flex items-center flex-1" onClick={(e) => {
              const isWarehouse = warehouses.some(w => w.name.toLowerCase() === item.name.toLowerCase())
              if (hasChildren && (item.name.toLowerCase() === 'warehouses' || isWarehouse)) {
                // For warehouses and individual warehouse items, allow both navigation and expansion
                e.stopPropagation()
                setSidebarOpen(false)
              }
            }}>
              <item.icon className="h-5 w-5 mr-3 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </Link>
          ) : (
            <div className="flex items-center flex-1">
              <item.icon className="h-5 w-5 mr-3 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
          )}

          {hasChildren && (
            <div className="flex-shrink-0">
              {item.name.toLowerCase() === 'warehouses' || warehouses.some(w => w.name.toLowerCase() === item.name.toLowerCase()) ? (
                // Always show expanded for warehouses and individual warehouse items
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              ) : (
                // Normal expand/collapse for other items
                isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )
              )}
            </div>
          )}
        </div>

        {hasChildren && (item.name.toLowerCase() === 'warehouses' || warehouses.some(w => w.name.toLowerCase() === item.name.toLowerCase()) || isExpanded) && (
          <div className="space-y-1">
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">Dashboard</span>
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <div className="space-y-1">
                      {navigation.map((item) => renderNavigationItem(item))}
                    </div>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-xl font-bold text-gray-900">Dashboard</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <div className="space-y-1">
              {navigation.map((item) => renderNavigationItem(item))}
            </div>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProviders>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </DashboardProviders>
  )
}

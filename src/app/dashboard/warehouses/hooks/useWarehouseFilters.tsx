// app/dashboard/warehouses/hooks/useWarehouseFilters.tsx
import { useState, useMemo } from 'react'
import { Warehouse, WarehouseFilterState } from '../utils/warehouseTypes'

const DEFAULT_FILTERS: WarehouseFilterState = {
  search: '',
  status: '',
  country: '',
  hasLayout: false
}

export function useWarehouseFilters(warehouses: Warehouse[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<WarehouseFilterState>(DEFAULT_FILTERS)

  // Filter warehouses based on current search and filter settings
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => {
      // Search term filtering
      const matchesSearch = searchTerm === '' ||
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (warehouse.description && warehouse.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        warehouse.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.address.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.address.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (warehouse.contactInfo.managerName && warehouse.contactInfo.managerName.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filtering
      const matchesStatus = filters.status === '' || warehouse.status === filters.status

      // Country filtering
      const matchesCountry = filters.country === '' || warehouse.address.country === filters.country

      return matchesSearch && matchesStatus && matchesCountry
    })
  }, [warehouses, searchTerm, filters])

  // Helper function to reset filters to defaults
  const resetFilters = () => {
    setSearchTerm('')
    setFilters(DEFAULT_FILTERS)
  }

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' ||
           filters.status !== '' ||
           filters.country !== ''
  }

  // Get filter summary for display
  const getFilterSummary = () => {
    const activeFilters = []

    if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`)
    if (filters.status) activeFilters.push(`Status: ${filters.status}`)
    if (filters.country) activeFilters.push(`Country: ${filters.country}`)

    return activeFilters
  }

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredWarehouses,
    resetFilters,
    hasActiveFilters,
    getFilterSummary
  }
}

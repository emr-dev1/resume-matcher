import { useState, useEffect, useMemo } from 'react'
import { Filter, X, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function MatchFilters({ 
  positions = [], 
  matches = [],
  onFiltersChange, 
  initialFilters = {} 
}) {
  const [filters, setFilters] = useState({
    minScore: '',
    positionId: '',
    topN: '',
    positionField: '',
    positionValue: '',
    positionOperator: 'contains',
    textSearch: '',
    ...initialFilters
  })

  // Extract available position data columns from matches
  const positionColumns = useMemo(() => {
    const columns = new Set()
    matches.forEach(match => {
      if (match.position_data && typeof match.position_data === 'object') {
        Object.keys(match.position_data).forEach(key => columns.add(key))
      }
    })
    return Array.from(columns).sort()
  }, [matches])

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const newFilters = {
      minScore: '',
      positionId: '',
      topN: '',
      positionField: '',
      positionValue: '',
      positionOperator: 'contains',
      textSearch: ''
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* First Row - Basic Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-3">
        {/* Minimum Score Filter */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Min Score (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="0-100"
              value={filters.minScore ? Math.round(filters.minScore * 100) : ''}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  handleFilterChange('minScore', '')
                } else {
                  const numValue = parseFloat(value)
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    handleFilterChange('minScore', numValue / 100)
                  }
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
        </div>

        {/* Position Filter */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Position
          </label>
          <select
            value={filters.positionId}
            onChange={(e) => handleFilterChange('positionId', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Positions</option>
            {positions.map((position) => {
              const title = position.original_data?.title || 
                          position.original_data?.job_title || 
                          position.original_data?.position || 
                          `Position ${position.id}`
              return (
                <option key={position.id} value={position.id}>
                  {title.length > 30 ? `${title.slice(0, 30)}...` : title}
                </option>
              )
            })}
          </select>
        </div>

        {/* Top N Filter */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Top Matches
          </label>
          <select
            value={filters.topN}
            onChange={(e) => handleFilterChange('topN', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="50">Top 50</option>
          </select>
        </div>
      </div>

      {/* Second Row - Advanced Position Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Global Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search Position Data
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search all position fields..."
              value={filters.textSearch}
              onChange={(e) => handleFilterChange('textSearch', e.target.value)}
              className="w-full px-2 py-1 pl-7 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          </div>
        </div>

        {/* Position Field Filter */}
        {positionColumns.length > 0 && (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Position Field
              </label>
              <select
                value={filters.positionField}
                onChange={(e) => handleFilterChange('positionField', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select field...</option>
                {positionColumns.map((column) => (
                  <option key={column} value={column}>
                    {column.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {filters.positionField && (
              <>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Operator
                  </label>
                  <select
                    value={filters.positionOperator}
                    onChange={(e) => handleFilterChange('positionOperator', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="starts_with">Starts with</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    placeholder="Enter value..."
                    value={filters.positionValue}
                    onChange={(e) => handleFilterChange('positionValue', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-200">
          {filters.minScore && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
              ≥{Math.round(filters.minScore * 100)}%
            </span>
          )}
          {filters.positionId && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
              Specific position
            </span>
          )}
          {filters.topN && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
              Top {filters.topN}
            </span>
          )}
          {filters.textSearch && (
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
              Search: "{filters.textSearch}"
            </span>
          )}
          {filters.positionField && filters.positionValue && (
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
              {filters.positionField} {filters.positionOperator} "{filters.positionValue}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default MatchFilters
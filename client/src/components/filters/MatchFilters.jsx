import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function MatchFilters({ 
  positions = [], 
  onFiltersChange, 
  initialFilters = {} 
}) {
  const [filters, setFilters] = useState({
    minScore: '',
    positionId: '',
    topN: '',
    ...initialFilters
  })

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      minScore: '',
      positionId: '',
      topN: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minimum Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Score
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={filters.minScore || 0}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(filters.minScore || 0) * 100}%, #e5e7eb ${(filters.minScore || 0) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0%</span>
                <span className="font-medium">
                  {filters.minScore ? `${Math.round(filters.minScore * 100)}%+` : 'Any'}
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <select
              value={filters.positionId}
              onChange={(e) => handleFilterChange('positionId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Positions</option>
              {positions.map((position) => {
                const title = position.original_data?.title || 
                            position.original_data?.job_title || 
                            position.original_data?.position || 
                            `Position ${position.id}`
                return (
                  <option key={position.id} value={position.id}>
                    {title.length > 40 ? `${title.slice(0, 40)}...` : title}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Top N Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top Matches
            </label>
            <select
              value={filters.topN}
              onChange={(e) => handleFilterChange('topN', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Matches</option>
              <option value="5">Top 5 per position</option>
              <option value="10">Top 10 per position</option>
              <option value="20">Top 20 per position</option>
              <option value="50">Top 50 per position</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.minScore && (
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                    Score ≥ {Math.round(filters.minScore * 100)}%
                  </span>
                )}
                {filters.positionId && (
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                    Specific position
                  </span>
                )}
                {filters.topN && (
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                    Top {filters.topN} per position
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MatchFilters
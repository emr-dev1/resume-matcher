import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'

function MatchDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No match data available</p>
        </div>
      </div>
    )
  }

  // Calculate max value for scaling
  const maxCount = Math.max(...data.map(d => d.count))
  const maxHeight = 200

  const getBarColor = (range) => {
    const score = parseInt(range.split('-')[1])
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBarHeight = (count) => {
    if (maxCount === 0) return 0
    return Math.max((count / maxCount) * maxHeight, count > 0 ? 8 : 0) // Minimum 8px for visible bars
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between space-x-2" style={{ height: `${maxHeight + 40}px` }}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-700 mb-1">
                {item.count}
              </span>
              <div
                className={`${getBarColor(item.range)} rounded-t transition-all duration-300 hover:opacity-80 min-w-8`}
                style={{ 
                  height: `${getBarHeight(item.count)}px`,
                  width: '100%'
                }}
                title={`${item.range}: ${item.count} matches`}
              />
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight">
              {item.range}
            </span>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Excellent (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Good (60-80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Poor (&lt;60%)</span>
        </div>
      </div>
    </div>
  )
}

export default MatchDistributionChart
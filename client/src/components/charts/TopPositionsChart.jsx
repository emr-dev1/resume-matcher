import { TrendingUp } from 'lucide-react'

function TopPositionsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No position data available</p>
        </div>
      </div>
    )
  }

  const maxMatches = Math.max(...data.map(d => d.match_count))
  
  const getBarWidth = (count) => {
    if (maxMatches === 0) return 0
    return Math.max((count / maxMatches) * 100, count > 0 ? 5 : 0) // Minimum 5% for visible bars
  }

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((position, index) => (
        <div key={position.position_id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate" title={position.title}>
                {position.title}
              </h4>
              <p className="text-xs text-gray-600">Position #{position.position_id}</p>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className="text-right">
                <div className="text-sm font-medium">{position.match_count} matches</div>
                <div className={`text-xs ${getScoreColor(position.avg_score)}`}>
                  Avg: {(position.avg_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${getBarWidth(position.match_count)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      
      {data.length > 5 && (
        <div className="text-center pt-2">
          <span className="text-sm text-gray-500">
            Showing top 5 of {data.length} positions
          </span>
        </div>
      )}
    </div>
  )
}

export default TopPositionsChart
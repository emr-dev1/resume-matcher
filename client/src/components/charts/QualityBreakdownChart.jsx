import { PieChart } from 'lucide-react'

function QualityBreakdownChart({ data = {} }) {
  const { excellent = 0, good = 0, poor = 0 } = data
  const total = excellent + good + poor

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No match quality data</p>
        </div>
      </div>
    )
  }

  // Calculate percentages and angles
  const excellentPct = ((excellent / total) * 100).toFixed(1)
  const goodPct = ((good / total) * 100).toFixed(1)
  const poorPct = ((poor / total) * 100).toFixed(1)

  // SVG pie chart using stroke-dasharray for simplicity
  const radius = 60
  const circumference = 2 * Math.PI * radius
  
  const excellentOffset = 0
  const goodOffset = (excellent / total) * circumference
  const poorOffset = ((excellent + good) / total) * circumference

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Background circle */}
          <svg width="140" height="140" className="transform -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
            />
            
            {/* Excellent segment */}
            {excellent > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#10b981" // green-500
                strokeWidth="20"
                strokeDasharray={`${(excellent / total) * circumference} ${circumference}`}
                strokeDashoffset={excellentOffset}
                strokeLinecap="round"
              />
            )}
            
            {/* Good segment */}
            {good > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#f59e0b" // yellow-500
                strokeWidth="20"
                strokeDasharray={`${(good / total) * circumference} ${circumference}`}
                strokeDashoffset={-goodOffset}
                strokeLinecap="round"
              />
            )}
            
            {/* Poor segment */}
            {poor > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#ef4444" // red-500
                strokeWidth="20"
                strokeDasharray={`${(poor / total) * circumference} ${circumference}`}
                strokeDashoffset={-poorOffset}
                strokeLinecap="round"
              />
            )}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Excellent (80%+)</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{excellent}</span>
            <span className="text-gray-500 ml-1">({excellentPct}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Good (60-80%)</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{good}</span>
            <span className="text-gray-500 ml-1">({goodPct}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Poor (&lt;60%)</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{poor}</span>
            <span className="text-gray-500 ml-1">({poorPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QualityBreakdownChart
import { Eye, Download } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable from './DataTable'

function ResultsTable({ 
  matches = [], 
  onViewDetails,
  onExport 
}) {
  const columns = [
    {
      key: 'rank',
      label: 'Rank',
      width: '16',
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          #{value}
        </Badge>
      )
    },
    {
      key: 'resume_filename',
      label: 'Resume',
      render: (value) => (
        <span className="font-medium text-gray-900 truncate max-w-xs" title={value}>
          {value}
        </span>
      )
    },
    {
      key: 'similarity_score',
      label: 'Match Score',
      width: '32',
      render: (value) => {
        const percentage = Math.round(value * 100)
        const getColor = (score) => {
          if (score >= 80) return 'bg-green-500'
          if (score >= 60) return 'bg-yellow-500'
          return 'bg-red-500'
        }
        
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
              <div
                className={`h-2 rounded-full transition-all ${getColor(percentage)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 min-w-12">
              {percentage}%
            </span>
          </div>
        )
      }
    },
    {
      key: 'position_data',
      label: 'Position Details',
      render: (value) => {
        if (!value) return '-'
        
        const entries = Object.entries(value).slice(0, 2) // Show first 2 fields
        return (
          <div className="space-y-1">
            {entries.map(([key, val]) => (
              <div key={key} className="text-xs">
                <span className="font-medium text-gray-600">{key}:</span>{' '}
                <span className="text-gray-900 truncate max-w-32 inline-block" title={val}>
                  {val}
                </span>
              </div>
            ))}
            {Object.keys(value).length > 2 && (
              <div className="text-xs text-gray-500">
                +{Object.keys(value).length - 2} more
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '20',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails?.(row)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const handleRowClick = (row) => {
    onViewDetails?.(row)
  }

  return (
    <div>
      <DataTable
        data={matches}
        columns={columns}
        sortable={true}
        filterable={true}
        selectable={true}
        pagination={true}
        pageSize={50}
        onRowClick={handleRowClick}
        onExport={onExport}
        className="excel-like"
      />
    </div>
  )
}

export default ResultsTable
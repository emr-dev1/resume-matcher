import { Badge } from '@/components/ui/Badge'
import DataTable from './DataTable'

function PositionsTable({ 
  positions = [], 
  embeddingColumns = [], 
  outputColumns = [],
  onExport 
}) {
  // Create columns configuration
  const columns = outputColumns.map(columnKey => ({
    key: columnKey,
    label: columnKey,
    render: (value, row) => {
      const isEmbeddingColumn = embeddingColumns.includes(columnKey)
      return (
        <div className="flex items-center space-x-2">
          <span className="truncate max-w-xs" title={value}>
            {value || '-'}
          </span>
          {isEmbeddingColumn && (
            <Badge variant="blue" size="sm">
              Embedding
            </Badge>
          )}
        </div>
      )
    }
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Position Data ({positions.length} positions)
          </h3>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-1">
              <Badge variant="blue" size="sm">Embedding</Badge>
              <span className="text-sm text-gray-600">
                {embeddingColumns.length} columns for matching
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {outputColumns.length} columns in output
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={positions}
        columns={columns}
        sortable={true}
        filterable={true}
        selectable={false}
        pagination={true}
        pageSize={25}
        onExport={onExport}
        className="excel-like"
      />
    </div>
  )
}

export default PositionsTable
import React, { useState, useEffect } from 'react';

function ColumnSelector({ columns, preview, onConfirm }) {
  const [embeddingColumns, setEmbeddingColumns] = useState([]);
  const [outputColumns, setOutputColumns] = useState([]);

  useEffect(() => {
    // Default: select all columns for output
    setOutputColumns(columns);
  }, [columns]);

  const handleEmbeddingToggle = (column) => {
    setEmbeddingColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  const handleOutputToggle = (column) => {
    setOutputColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  const handleConfirm = () => {
    if (embeddingColumns.length === 0) {
      alert('Please select at least one column for embedding generation');
      return;
    }
    onConfirm(embeddingColumns, outputColumns);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Select Columns</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Columns for Embedding Generation</h3>
        <p className="text-sm text-gray-600 mb-3">
          Select which columns should be used to generate embeddings for matching
        </p>
        <div className="space-y-2">
          {columns.map(column => (
            <label key={column} className="flex items-center">
              <input
                type="checkbox"
                checked={embeddingColumns.includes(column)}
                onChange={() => handleEmbeddingToggle(column)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm">{column}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Columns for Output</h3>
        <p className="text-sm text-gray-600 mb-3">
          Select which columns should be included in the results
        </p>
        <div className="space-y-2">
          {columns.map(column => (
            <label key={column} className="flex items-center">
              <input
                type="checkbox"
                checked={outputColumns.includes(column)}
                onChange={() => handleOutputToggle(column)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm">{column}</span>
            </label>
          ))}
        </div>
      </div>

      {preview && preview.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(column => (
                    <th key={column} className="px-3 py-2 text-left font-medium text-gray-900">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preview.slice(0, 3).map((row, index) => (
                  <tr key={index}>
                    {columns.map(column => (
                      <td key={column} className="px-3 py-2 text-gray-700">
                        {row[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={embeddingColumns.length === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Confirm Selection
      </button>
    </div>
  );
}

export default ColumnSelector;
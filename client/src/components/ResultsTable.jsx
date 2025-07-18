import React, { useState } from 'react';

function ResultsTable({ matches, onViewDetails }) {
  const [sortBy, setSortBy] = useState('rank');
  const [filterPosition, setFilterPosition] = useState('');

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'rank') return a.rank - b.rank;
    if (sortBy === 'score') return b.similarity_score - a.similarity_score;
    return 0;
  });

  const filteredMatches = filterPosition
    ? sortedMatches.filter(match => 
        match.position_data && 
        Object.values(match.position_data).some(val => 
          String(val).toLowerCase().includes(filterPosition.toLowerCase())
        )
      )
    : sortedMatches;

  const uniquePositions = [...new Set(matches.map(m => m.position_id))];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Match Results</h2>
          
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Filter positions..."
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="rank">Sort by Rank</option>
              <option value="score">Sort by Score</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Similarity Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No matches found
                </td>
              </tr>
            ) : (
              filteredMatches.map((match) => (
                <tr key={match.match_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{match.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {match.resume_filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="text-sm font-medium">
                        {(match.similarity_score * 100).toFixed(2)}%
                      </div>
                      <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${match.similarity_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {Object.entries(match.position_data || {}).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onViewDetails(match.match_id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {uniquePositions.length > 1 && (
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
          Showing results for {uniquePositions.length} positions
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
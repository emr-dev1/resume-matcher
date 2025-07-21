import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Upload, Play, Download, FileText, Users, RefreshCw, Clock, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/table/DataTable'
import ResultsTable from '@/components/table/ResultsTable'
import ResumeDetailModal from '@/components/modals/ResumeDetailModal'
import MatchDistributionChart from '@/components/charts/MatchDistributionChart'
import QualityBreakdownChart from '@/components/charts/QualityBreakdownChart'
import TopPositionsChart from '@/components/charts/TopPositionsChart'
import MatchFilters from '@/components/filters/MatchFilters'
import { useProjectStore, useUIStore, useUploadStore, useResultsStore, useProcessingStore } from '@/stores'
import api from '@/services/api'

function ProjectDetail() {
  const { selectedProject, projects, setLoading, loading } = useProjectStore()
  const { setCurrentView, projectDetailActiveTab, setProjectDetailActiveTab } = useUIStore()
  const { matches, setMatches, loadingMatches, setLoadingMatches } = useResultsStore()
  const { currentJobId, processingStatus, progress } = useProcessingStore()
  
  const [projectData, setProjectData] = useState(null)
  const [positions, setPositions] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [totalMatches, setTotalMatches] = useState(0)
  const [matchStatistics, setMatchStatistics] = useState(null)
  const [matchFilters, setMatchFilters] = useState({})
  const [filteredMatches, setFilteredMatches] = useState([])
  // Use activeTab from UI store with fallback to local state
  const activeTab = projectDetailActiveTab || 'overview'
  const setActiveTab = setProjectDetailActiveTab
  
  // Track previous processing status for auto-refresh
  const previousStatus = useRef(processingStatus)

  const project = projects.find(p => p.id === selectedProject) || projectData

  useEffect(() => {
    if (selectedProject) {
      loadProjectData()
    }
  }, [selectedProject])

  // Add effect to reload data when coming back from upload
  useEffect(() => {
    const handleFocus = () => {
      if (selectedProject && document.visibilityState === 'visible') {
        loadProjectData()
      }
    }
    
    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [selectedProject])

  // Monitor processing status and auto-refresh matches when processing completes
  useEffect(() => {
    // If processing just completed, refresh matches data
    if (previousStatus.current === 'processing' && processingStatus === 'completed') {
      setTimeout(() => {
        loadMatches(selectedProject)
      }, 1000) // Small delay to ensure backend has finished
    }
    
    previousStatus.current = processingStatus
  }, [processingStatus, selectedProject])

  const loadMatches = async (projectId) => {
    if (!projectId) return []
    
    try {
      setLoadingMatches(true)
      // Load all matches without limit and get total count
      const [matchesData, countData] = await Promise.all([
        api.getProjectMatches(projectId, { limit: null }), // Get all matches
        api.getProjectMatchesCount(projectId)
      ])
      
      setMatches(matchesData)
      setTotalMatches(countData.total_matches || 0)
      
      // Apply current filters to the new data
      applyFilters(matchesData, matchFilters)
      
      return matchesData
    } catch (error) {
      console.error('Error loading matches:', error)
      setMatches([])
      setTotalMatches(0)
      return []
    } finally {
      setLoadingMatches(false)
    }
  }

  const loadMatchStatistics = async (projectId) => {
    if (!projectId) return
    
    try {
      const stats = await api.getMatchStatistics(projectId)
      setMatchStatistics(stats)
    } catch (error) {
      console.error('Error loading match statistics:', error)
      setMatchStatistics(null)
    }
  }

  const loadProjectData = async () => {
    if (!selectedProject) return
    
    setLoading(true)
    try {
      // Load project details, positions, resumes, matches, and statistics
      const [projectRes, positionsRes, resumesRes, matchesRes] = await Promise.all([
        api.getProject(selectedProject),
        api.getPositions(selectedProject),
        api.getResumes(selectedProject),
        loadMatches(selectedProject)
      ])
      
      setProjectData(projectRes)
      setPositions(positionsRes)
      setResumes(resumesRes)
      
      // Load statistics if we have matches
      if (matchesRes && matchesRes.length > 0) {
        loadMatchStatistics(selectedProject)
      }
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleUploadMore = () => {
    setCurrentView('project-upload')
  }

  const handleRunMatching = async () => {
    try {
      setLoading(true)
      const result = await api.startProcessing(selectedProject)
      console.log('Processing started:', result)
      setCurrentView('project-process')
    } catch (error) {
      console.error('Error starting processing:', error)
      // Could add toast notification here
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureParsing = () => {
    setCurrentView('project-configure')
  }

  const handleResumeClick = (resume) => {
    setSelectedResume(resume)
    setShowResumeModal(true)
  }

  const handleCloseResumeModal = () => {
    setShowResumeModal(false)
    setSelectedResume(null)
  }

  const handleFiltersChange = (filters) => {
    setMatchFilters(filters)
    applyFilters(matches, filters)
  }

  const applyFilters = (matchesData, filters) => {
    let filtered = [...matchesData]

    // Apply minimum score filter
    if (filters.minScore && filters.minScore > 0) {
      filtered = filtered.filter(match => match.similarity_score >= parseFloat(filters.minScore))
    }

    // Apply position filter
    if (filters.positionId) {
      filtered = filtered.filter(match => match.position_id === parseInt(filters.positionId))
    }

    // Apply top N per position filter
    if (filters.topN && parseInt(filters.topN) > 0) {
      const topN = parseInt(filters.topN)
      const groupedByPosition = filtered.reduce((acc, match) => {
        if (!acc[match.position_id]) {
          acc[match.position_id] = []
        }
        acc[match.position_id].push(match)
        return acc
      }, {})

      // Keep only top N matches per position
      filtered = Object.values(groupedByPosition).flatMap(positionMatches => 
        positionMatches
          .sort((a, b) => b.similarity_score - a.similarity_score)
          .slice(0, topN)
      )
    }

    setFilteredMatches(filtered)
  }

  const isProcessingActive = processingStatus === 'processing' || processingStatus === 'pending'

  const handleExportMatches = async (format = 'csv') => {
    try {
      setLoading(true)
      await api.exportResults(selectedProject, format)
    } catch (error) {
      console.error('Error exporting matches:', error)
      // Could add toast notification here
    } finally {
      setLoading(false)
    }
  }

  const handleExportFiltered = (format = 'csv') => {
    if (filteredMatches.length === 0) return

    // Create CSV content from filtered matches
    const headers = ['Rank', 'Resume', 'Match Score (%)', 'Position ID', 'Position Data']
    const rows = filteredMatches.map(match => [
      match.rank,
      match.resume_filename,
      Math.round(match.similarity_score * 100),
      match.position_id,
      JSON.stringify(match.position_data)
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Download the filtered results
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filtered_matches_${selectedProject}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const positionColumns = [
    {
      key: 'id',
      label: 'ID',
      width: '16',
      render: (value) => (
        <span className="font-mono text-sm text-gray-600">#{value}</span>
      )
    },
    {
      key: 'original_data',
      label: 'Position Data',
      render: (value, row) => {
        if (!value || typeof value !== 'object') return 'N/A'
        
        // Get the first few key-value pairs to display
        const entries = Object.entries(value).slice(0, 3)
        return (
          <div className="space-y-1">
            {entries.map(([key, val]) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-gray-700">{key}:</span>{' '}
                <span className="text-gray-900">{String(val).substring(0, 50)}{String(val).length > 50 ? '...' : ''}</span>
              </div>
            ))}
            {Object.keys(value).length > 3 && (
              <div className="text-xs text-gray-500">
                +{Object.keys(value).length - 3} more fields
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'embedding_columns',
      label: 'Embedding Columns',
      render: (value) => (
        <div className="text-sm">
          {Array.isArray(value) ? (
            <div className="space-y-1">
              {value.map(col => (
                <span key={col} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                  {col}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500">Not configured</span>
          )}
        </div>
      )
    },
    {
      key: 'output_columns',
      label: 'Output Columns',
      render: (value) => (
        <div className="text-sm">
          {Array.isArray(value) ? (
            <div className="space-y-1">
              {value.slice(0, 3).map(col => (
                <span key={col} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                  {col}
                </span>
              ))}
              {value.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{value.length - 3} more
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Not configured</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '32',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ]

  const resumeColumns = [
    {
      key: 'id',
      label: 'ID',
      width: '16',
      render: (value) => (
        <span className="font-mono text-sm text-gray-600">#{value}</span>
      )
    },
    {
      key: 'filename',
      label: 'Resume File',
      render: (value, row) => (
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => handleResumeClick(row)}
        >
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900 truncate max-w-xs hover:text-blue-600" title={value}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'parsing_method',
      label: 'Parsing',
      render: (value, row) => {
        const method = value || 'full_text'
        const hasSections = row.parsed_sections && Object.keys(row.parsed_sections).length > 0
        return (
          <div className="text-sm">
            <div className="flex items-center space-x-2">
              {method === 'section_based' ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Section-Based
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  Full Text
                </span>
              )}
            </div>
            {hasSections && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.keys(row.parsed_sections).length} sections
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'extracted_text',
      label: 'Text Preview',
      render: (value, row) => (
        <div className="text-sm text-gray-600">
          <div className="truncate max-w-md" title={value}>
            {value || 'No text extracted'}
          </div>
          {row.text_length && (
            <div className="text-xs text-gray-500 mt-1">
              {row.text_length.toLocaleString()} characters
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Uploaded',
      width: '32',
      render: (value) => (
        <span className="text-gray-600 text-sm">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-600">Loading project...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'positions', label: `Positions (${positions.length})`, icon: Users },
    { id: 'resumes', label: `Resumes (${resumes.length})`, icon: FileText },
    { id: 'matches', label: `Matches (${totalMatches})`, icon: Play }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">Status: {project.status}</span>
              {isProcessingActive && (
                <>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-600 font-medium">
                      {processingStatus === 'pending' ? 'Starting' : 'Processing'} 
                      {progress > 0 && ` (${progress}%)`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={loadProjectData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleConfigureParsing}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Parsing
          </Button>
          <Button variant="outline" onClick={handleUploadMore}>
            <Upload className="h-4 w-4 mr-2" />
            Upload More
          </Button>
          <Button 
            onClick={handleRunMatching} 
            disabled={isProcessingActive || loading}
          >
            {isProcessingActive ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {processingStatus === 'pending' ? 'Starting...' : 'Processing...'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Matching
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Positions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{positions.length}</div>
                  <p className="text-xs text-gray-600">job positions uploaded</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span>Resumes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resumes.length}</div>
                  <p className="text-xs text-gray-600">resumes processed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-purple-600" />
                    <span>Matches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMatches}</div>
                  <p className="text-xs text-gray-600">matches found</p>
                  {matchStatistics?.overall_stats && (
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {(matchStatistics.overall_stats.avg_score * 100).toFixed(1)}% match score
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts */}
            {matchStatistics && totalMatches > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Match Score Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Match Score Distribution</CardTitle>
                    <CardDescription>
                      Distribution of similarity scores across all matches
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MatchDistributionChart data={matchStatistics.score_distribution} />
                  </CardContent>
                </Card>

                {/* Quality Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Match Quality Breakdown</CardTitle>
                    <CardDescription>
                      Categorization of matches by quality level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QualityBreakdownChart data={matchStatistics.quality_breakdown} />
                  </CardContent>
                </Card>

                {/* Top Positions */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Performing Positions</CardTitle>
                    <CardDescription>
                      Positions with the most matches and their average scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TopPositionsChart data={matchStatistics.top_positions} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <Card>
            <CardHeader>
              <CardTitle>Job Positions</CardTitle>
              <CardDescription>
                All job positions uploaded for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={positions}
                columns={positionColumns}
                sortable={true}
                filterable={true}
                selectable={true}
                pagination={true}
                pageSize={25}
                className="excel-like"
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'resumes' && (
          <Card>
            <CardHeader>
              <CardTitle>Resumes</CardTitle>
              <CardDescription>
                All resumes uploaded and processed for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={resumes}
                columns={resumeColumns}
                sortable={true}
                filterable={true}
                selectable={true}
                pagination={true}
                pageSize={25}
                className="excel-like"
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Filters */}
            {matches.length > 0 && (
              <MatchFilters
                positions={positions}
                onFiltersChange={handleFiltersChange}
                initialFilters={matchFilters}
              />
            )}

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span>Match Results</span>
                    {filteredMatches.length !== matches.length && matches.length > 0 && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({filteredMatches.length} of {matches.length} matches)
                      </span>
                    )}
                  </div>
                  {filteredMatches.length > 0 && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportFiltered('csv')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Filtered
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportMatches('csv')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  AI-powered matches between resumes and job positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMatches ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-gray-600">Loading matches...</span>
                    </div>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="space-y-2">
                      <p className="text-gray-600">No matches found</p>
                      <p className="text-sm text-gray-500">
                        Upload positions and resumes, then run the matching process to see results
                      </p>
                      <div className="flex justify-center space-x-4 mt-4">
                        <Button variant="outline" onClick={handleUploadMore}>
                          Upload Files
                        </Button>
                        <Button onClick={handleRunMatching}>
                          Run Matching
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : filteredMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="space-y-2">
                      <p className="text-gray-600">No matches meet the current filter criteria</p>
                      <p className="text-sm text-gray-500">
                        Try adjusting your filters to see more results
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResultsTable
                    matches={filteredMatches}
                    onViewDetails={(match) => {
                      console.log('View match details:', match)
                    }}
                    onExport={handleExportFiltered}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Resume Detail Modal */}
      {showResumeModal && (
        <ResumeDetailModal
          isOpen={showResumeModal}
          onClose={handleCloseResumeModal}
          resume={selectedResume}
          projectId={selectedProject}
        />
      )}
    </div>
  )
}

export default ProjectDetail
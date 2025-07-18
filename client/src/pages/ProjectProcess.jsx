import { useState, useEffect } from 'react'
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProjectStore, useUIStore, useProcessingStore, useResultsStore } from '@/stores'
import api from '@/services/api'

function ProjectProcess() {
  const { selectedProject, projects } = useProjectStore()
  const { setCurrentView, setProjectDetailActiveTab } = useUIStore()
  const { setMatches, setLoadingMatches } = useResultsStore()
  const [currentJobId, setCurrentJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  const project = projects.find(p => p.id === selectedProject)

  useEffect(() => {
    let interval
    if (isPolling && currentJobId) {
      interval = setInterval(async () => {
        try {
          const status = await api.getJobStatus(currentJobId)
          setJobStatus(status)
          
          if (status.status === 'completed' || status.status === 'failed') {
            setIsPolling(false)
            
            // If completed successfully, preload matches data
            if (status.status === 'completed') {
              try {
                const matchesData = await api.getProjectMatches(selectedProject)
                setMatches(matchesData)
              } catch (error) {
                console.error('Error preloading matches:', error)
              }
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error)
          setIsPolling(false)
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, currentJobId])

  const handleBackToProject = () => {
    setCurrentView('project-detail')
  }

  const handleViewResults = async () => {
    try {
      // Load the latest matches data before navigating
      setLoadingMatches(true)
      const matchesData = await api.getProjectMatches(selectedProject)
      setMatches(matchesData)
      
      // Set the active tab to matches before navigating
      setProjectDetailActiveTab('matches')
      
      // Navigate to project detail
      setCurrentView('project-detail')
    } catch (error) {
      console.error('Error loading matches:', error)
      // Still navigate even if matches fail to load
      setProjectDetailActiveTab('matches')
      setCurrentView('project-detail')
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleStartProcessing = async () => {
    try {
      const result = await api.startProcessing(selectedProject)
      setCurrentJobId(result.job_id)
      setJobStatus({
        job_id: result.job_id,
        status: 'pending',
        progress: 0
      })
      setIsPolling(true)
    } catch (error) {
      console.error('Error starting processing:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'processing':
        return 'text-blue-600'
      case 'pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToProject}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Processing</h1>
            <p className="text-gray-600">
              {project ? `Process matches for ${project.name}` : 'Process project matches'}
            </p>
          </div>
        </div>
      </div>

      {/* Processing Control */}
      {!currentJobId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>Start Matching Process</span>
            </CardTitle>
            <CardDescription>
              Generate AI embeddings and calculate similarity scores between resumes and job positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartProcessing}>
              <Play className="h-4 w-4 mr-2" />
              Start Processing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {jobStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(jobStatus.status)}
              <span>Processing Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Job ID:</span>
              <span className="text-sm text-gray-600">{jobStatus.job_id}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm font-medium ${getStatusColor(jobStatus.status)}`}>
                {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
              </span>
            </div>

            {jobStatus.progress !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-sm text-gray-600">{jobStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress}%` }}
                  />
                </div>
              </div>
            )}

            {jobStatus.started_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Started:</span>
                <span className="text-sm text-gray-600">
                  {new Date(jobStatus.started_at).toLocaleString()}
                </span>
              </div>
            )}

            {jobStatus.completed_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed:</span>
                <span className="text-sm text-gray-600">
                  {new Date(jobStatus.completed_at).toLocaleString()}
                </span>
              </div>
            )}

            {jobStatus.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {jobStatus.error_message}
                </p>
              </div>
            )}

            {jobStatus.status === 'completed' && (
              <div className="pt-4 space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Processing Complete!</strong> Your matches have been generated and are ready to view.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleViewResults}>
                    View Match Results
                  </Button>
                  <Button variant="outline" onClick={handleBackToProject}>
                    Back to Project
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Processing Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">
            <p>1. <strong>AI Embeddings:</strong> Generate semantic embeddings for job positions and resumes using Ollama</p>
            <p>2. <strong>Similarity Calculation:</strong> Calculate cosine similarity scores between all position-resume pairs</p>
            <p>3. <strong>Ranking:</strong> Rank resumes by similarity score for each position</p>
            <p>4. <strong>Results:</strong> Store match results for viewing and export</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectProcess
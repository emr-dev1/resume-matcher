import { Menu, Bell, User, ArrowLeft, RefreshCw, Settings, Upload, Play, Clock, Loader2 } from 'lucide-react'
import { useUIStore, useProjectStore, useProcessingStore } from '@/stores'
import Button from '@/components/ui/Button'
import api from '@/services/api'
import { useState } from 'react'

function Header() {
  const { setSidebarMobile, currentView, setCurrentView } = useUIStore()
  const { selectedProject, projects, loading, setLoading } = useProjectStore()
  const { processingStatus, progress } = useProcessingStore()
  const [isStartingMatch, setIsStartingMatch] = useState(false)

  // Get current project data
  const project = projects.find(p => p.id === selectedProject)
  const isProjectView = currentView === 'project-detail'
  const isProcessingActive = processingStatus === 'processing' || processingStatus === 'pending'

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleRefresh = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      // Trigger refresh by navigating away and back
      setCurrentView('dashboard')
      setTimeout(() => setCurrentView('project-detail'), 100)
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureParsing = () => {
    setCurrentView('project-configure')
  }

  const handleUploadMore = () => {
    setCurrentView('project-upload')
  }

  const handleRunMatching = async () => {
    try {
      setIsStartingMatch(true)
      setLoading(true)
      const result = await api.startProcessing(selectedProject)
      console.log('Processing started:', result)
      setCurrentView('project-process')
    } catch (error) {
      console.error('Error starting processing:', error)
      // TODO: Add toast notification for error
    } finally {
      setIsStartingMatch(false)
      setLoading(false)
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left side - Navigation and project info */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarMobile(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Back button for project views */}
        {isProjectView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Project info */}
        {isProjectView && project && (
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{project.status}</span>
                {isProcessingActive && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
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
        )}
      </div>

      {/* Right side - Project toolbar and user actions */}
      <div className="flex items-center space-x-2">
        {/* Project toolbar - only show on project detail */}
        {isProjectView && project && (
          <>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleConfigureParsing}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleUploadMore}>
              <Upload className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRunMatching} 
              disabled={isProcessingActive || loading || isStartingMatch}
              className="text-xs"
            >
              {isStartingMatch ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Initializing...
                </>
              ) : isProcessingActive ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  {processingStatus === 'pending' ? 'Starting...' : 'Processing...'}
                  {progress > 0 && ` (${progress}%)`}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run Matching
                </>
              )}
            </Button>
            <div className="h-6 w-px bg-gray-200 mx-2" />
          </>
        )}

        {/* User actions */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">User</span>
        </Button>
      </div>
    </header>
  )
}

export default Header
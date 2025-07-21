import { useEffect, useState } from 'react'
import { Plus, FolderOpen, Calendar, TrendingUp, Trash2, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProjectStore, useUIStore } from '@/stores'
import api from '@/services/api'

function Dashboard() {
  const { projects, setProjects, loading, setLoading, setSelectedProject, addProject, removeProject } = useProjectStore()
  const { setCurrentView } = useUIStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectMenuOpen, setProjectMenuOpen] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await api.listProjects()
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project) => {
    setSelectedProject(project.id)
    setCurrentView('project-detail')
  }

  const handleNewProject = () => {
    setShowCreateModal(true)
    setNewProjectName('')
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    try {
      setLoading(true)
      const newProject = await api.createProject(newProjectName.trim())
      addProject(newProject)
      setSelectedProject(newProject.id)
      setShowCreateModal(false)
      setNewProjectName('')
      setCurrentView('project-detail')
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId, projectName) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      setLoading(true)
      await api.deleteProject(projectId)
      removeProject(projectId)
      setProjectMenuOpen(null)
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderOpen,
      description: 'Active matching projects'
    },
    {
      title: 'This Month',
      value: projects.filter(p => {
        const created = new Date(p.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      icon: Calendar,
      description: 'Projects created this month'
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
          <span className="text-sm text-gray-600">Loading projects...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your resume matching projects</p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          {projects.length > 0 && (
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Get started by creating your first resume matching project. Upload job positions and resumes to find the best matches using AI.
              </p>
              <Button onClick={handleNewProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => handleProjectClick(project)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FolderOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setProjectMenuOpen(projectMenuOpen === project.id ? null : project.id)
                        }}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {projectMenuOpen === project.id && (
                        <div className="absolute right-0 top-8 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id, project.name)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete Project</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium text-green-600">{project.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateProject()
                    } else if (e.key === 'Escape') {
                      setShowCreateModal(false)
                      setNewProjectName('')
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProjectName('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown menus */}
      {projectMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProjectMenuOpen(null)}
        />
      )}
    </div>
  )
}

export default Dashboard
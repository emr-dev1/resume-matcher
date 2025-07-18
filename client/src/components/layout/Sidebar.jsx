import { 
  Home,
  FolderOpen, 
  Settings, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore, useProjectStore } from '@/stores'
import Button from '@/components/ui/Button'
import { useState } from 'react'

function Sidebar() {
  const { sidebarMobile, setSidebarMobile, setCurrentView } = useUIStore()
  const { projects, selectedProject, setSelectedProject } = useProjectStore()
  
  // Local state for hover-based expansion
  const [isHovered, setIsHovered] = useState(false)
  
  // Sidebar is always collapsed unless hovered
  const isExpanded = isHovered

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
    },
    {
      name: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          'hidden lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300 ease-in-out relative overflow-hidden',
          isExpanded ? 'lg:w-64' : 'lg:w-16'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center border-b border-gray-200 relative">
          {/* Collapsed state - centered icon */}
          {!isExpanded && (
            <div className="flex items-center justify-center w-full absolute inset-0">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          )}
          
          {/* Expanded state - full header */}
          {isExpanded && (
            <div className="flex items-center space-x-2 px-4 w-full">
              <Database className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 whitespace-nowrap">ResumeMatcher</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === 'Dashboard') {
                  setCurrentView('dashboard')
                } else if (item.name === 'Settings') {
                  setCurrentView('settings')
                }
              }}
              className={cn(
                'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative',
                !isExpanded && 'justify-center'
              )}
            >
              {/* Collapsed state - centered icon only */}
              {!isExpanded && (
                <item.icon className="flex-shrink-0 h-5 w-5" />
              )}
              
              {/* Expanded state - icon + text */}
              {isExpanded && (
                <>
                  <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </>
              )}
            </button>
          ))}
          
          {/* Projects section */}
          <div className="pt-4">
            <div className="px-2 mb-2 relative">
              {/* Collapsed state - centered add button */}
              {!isExpanded && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // TODO: Open create project modal
                    }}
                    title="Create new project"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Expanded state - header + add button */}
              {isExpanded && (
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Projects
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      // TODO: Open create project modal
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project.id)
                    setCurrentView('project-detail')
                  }}
                  className={cn(
                    'w-full group flex items-center px-2 py-2 text-sm rounded-md transition-all duration-200 relative',
                    selectedProject === project.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    !isExpanded && 'justify-center'
                  )}
                  title={!isExpanded ? project.name : undefined}
                >
                  {/* Collapsed state - centered icon only */}
                  {!isExpanded && (
                    <FolderOpen className="flex-shrink-0 h-4 w-4" />
                  )}
                  
                  {/* Expanded state - icon + text */}
                  {isExpanded && (
                    <>
                      <FolderOpen className="flex-shrink-0 h-4 w-4 mr-3" />
                      <span className="truncate whitespace-nowrap">{project.name}</span>
                    </>
                  )}
                </button>
              ))}
              
              {projects.length === 0 && isExpanded && (
                <div className="px-2 py-4 text-xs text-gray-500 text-center">
                  No projects yet.
                  <br />
                  Create your first project!
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden',
        sidebarMobile ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ResumeMatcher</span>
          </div>
          <button
            onClick={() => setSidebarMobile(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile navigation - same structure as desktop */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === 'Dashboard') {
                  setCurrentView('dashboard')
                } else if (item.name === 'Settings') {
                  setCurrentView('settings')
                }
                setSidebarMobile(false)
              }}
              className={cn(
                'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
          
          {/* Mobile projects section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Projects
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  // TODO: Open create project modal
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project.id)
                    setCurrentView('project-detail')
                    setSidebarMobile(false)
                  }}
                  className={cn(
                    'w-full group flex items-center px-2 py-2 text-sm rounded-md transition-colors',
                    selectedProject === project.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <FolderOpen className="flex-shrink-0 h-4 w-4 mr-3" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
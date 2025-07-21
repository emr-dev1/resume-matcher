import { useState, useEffect } from 'react'
import { ArrowLeft, Save, RefreshCw, FileText, Layers, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProjectStore, useUIStore } from '@/stores'
import api from '@/services/api'

function ProjectConfigure() {
  const { selectedProject, projects } = useProjectStore()
  const { setCurrentView } = useUIStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parsingMethod, setParsingMethod] = useState('full_text')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const project = projects.find(p => p.id === selectedProject)

  useEffect(() => {
    loadConfiguration()
  }, [selectedProject])

  const loadConfiguration = async () => {
    if (!selectedProject) return

    setLoading(true)
    setError(null)
    
    try {
      const configData = await api.getParsingConfig(selectedProject)
      setParsingMethod(configData.parsing_method || 'full_text')
    } catch (err) {
      console.error('Error loading configuration:', err)
      setError('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProject) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await api.updateParsingConfig(selectedProject, {
        parsing_method: parsingMethod,
        use_default_headers: true,
        section_headers: null,
        filter_strings: null
      })
      
      setSuccess('Configuration saved successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving configuration:', err)
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleBackToProject = () => {
    setCurrentView('project-detail')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Configure Parsing</h1>
            <p className="text-gray-600">
              {project ? `Configure resume parsing for ${project.name}` : 'Configure resume parsing'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={loadConfiguration}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card>
          <CardContent className="p-4">
            <div className="text-green-600">{success}</div>
          </CardContent>
        </Card>
      )}

      {/* Parsing Method Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Parsing Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Text Parsing Card */}
          <Card className={`cursor-pointer transition-all duration-200 border-3 relative overflow-hidden ${
            parsingMethod === 'full_text' 
              ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-100' 
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`} onClick={() => setParsingMethod('full_text')}>
            {/* Selection Badge */}
            {parsingMethod === 'full_text' && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>SELECTED</span>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className={`p-2 rounded-lg ${parsingMethod === 'full_text' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <FileText className={`h-8 w-8 ${parsingMethod === 'full_text' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className={`font-bold ${parsingMethod === 'full_text' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Full Text Parsing
                  </div>
                  <div className={`text-sm font-normal ${parsingMethod === 'full_text' ? 'text-blue-700' : 'text-gray-500'}`}>
                    Simple & Fast
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Extract all text from resumes as-is. Simple and fast processing for basic matching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Fast processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Works with any resume format</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="font-medium">Basic text matching only</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section-Based Parsing Card */}
          <Card className={`cursor-pointer transition-all duration-200 border-3 relative overflow-hidden ${
            parsingMethod === 'section_based' 
              ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-100' 
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`} onClick={() => setParsingMethod('section_based')}>
            {/* Selection Badge */}
            {parsingMethod === 'section_based' && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>SELECTED</span>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className={`p-2 rounded-lg ${parsingMethod === 'section_based' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Layers className={`h-8 w-8 ${parsingMethod === 'section_based' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className={`font-bold ${parsingMethod === 'section_based' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Section-Based Parsing
                  </div>
                  <div className={`text-sm font-normal ${parsingMethod === 'section_based' ? 'text-blue-700' : 'text-gray-500'}`}>
                    Intelligent & Precise
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Parse resumes into structured sections (Summary, Skills, Experience, etc.) for targeted matching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Intelligent section detection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Structured data extraction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">More precise matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span className="font-medium">Works best with standard resumes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Preview */}
      {parsingMethod === 'section_based' && (
        <Card>
          <CardHeader>
            <CardTitle>What Gets Extracted</CardTitle>
            <CardDescription>
              Section-based parsing will automatically detect and extract these resume sections:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Summary', desc: 'Professional summary or objective' },
                { name: 'Skills', desc: 'Technical skills and competencies' },
                { name: 'Experience', desc: 'Work history and job responsibilities' },
                { name: 'Education', desc: 'Academic qualifications and degrees' },
                { name: 'Certifications', desc: 'Professional certifications and licenses' },
                { name: 'Current Project', desc: 'Current role or ongoing projects' }
              ].map((section, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{section.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{section.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProjectConfigure
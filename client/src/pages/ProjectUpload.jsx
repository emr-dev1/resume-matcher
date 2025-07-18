import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, FileText, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/FileUpload'
import ColumnSelector from '@/components/ColumnSelector'
import { useProjectStore, useUIStore, useUploadStore } from '@/stores'
import api from '@/services/api'

function ProjectUpload() {
  const { selectedProject, projects } = useProjectStore()
  const { setCurrentView } = useUIStore()
  const {
    positionFile,
    setPositionFile,
    positionData,
    setPositionData,
    positionsConfirmed,
    setPositionsConfirmed,
    resumeFiles,
    setResumeFiles,
    uploading,
    setUploading,
    resetAllUploads
  } = useUploadStore()

  const [currentStep, setCurrentStep] = useState('selection') // 'selection', 'configure', 'upload'
  const [uploadType, setUploadType] = useState(null) // 'positions', 'resumes'
  const [uploadResults, setUploadResults] = useState(null)
  const [error, setError] = useState(null)

  const project = projects.find(p => p.id === selectedProject)

  useEffect(() => {
    // Reset upload state when component mounts
    resetAllUploads()
    setCurrentStep('selection')
    setUploadType(null)
    setUploadResults(null)
    setError(null)
  }, [selectedProject])

  const handleBackToProject = () => {
    resetAllUploads()
    setCurrentView('project-detail')
  }

  const handleBackToSelection = () => {
    setCurrentStep('selection')
    setUploadType(null)
    setError(null)
    resetAllUploads()
  }

  // Step 1: File Selection
  const handlePositionFileSelected = async (file) => {
    setError(null)
    setUploading(true)
    
    try {
      // Call the preview endpoint to get columns and preview data
      const result = await api.uploadPositions(selectedProject, file)
      
      setPositionFile(file)
      setPositionData(result)
      setUploadType('positions')
      setCurrentStep('configure')
    } catch (error) {
      console.error('Error previewing positions:', error)
      setError(`Error processing file: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleResumeFilesSelected = (files) => {
    setResumeFiles(files)
    setUploadType('resumes')
    setCurrentStep('upload')
  }

  // Step 2: Column Configuration (for positions only)
  const handleColumnConfirmation = async (embeddingColumns, outputColumns) => {
    if (!positionFile || !selectedProject) return

    setError(null)
    setUploading(true)
    
    try {
      // Call the confirm endpoint with column selections
      const result = await api.confirmPositions(
        selectedProject,
        positionFile,
        embeddingColumns,
        outputColumns
      )
      
      setPositionsConfirmed(true)
      setUploadResults({
        type: 'positions',
        message: result.message,
        count: result.count,
        embeddingColumns,
        outputColumns
      })
      setCurrentStep('upload')
    } catch (error) {
      console.error('Error confirming positions:', error)
      setError(`Error saving positions: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Step 3: Final Upload (for resumes)
  const handleResumeUpload = async () => {
    if (!resumeFiles.length || !selectedProject) return

    setError(null)
    setUploading(true)
    
    try {
      const result = await api.uploadResumes(selectedProject, resumeFiles)
      
      setUploadResults({
        type: 'resumes',
        message: result.message,
        results: result.results
      })
    } catch (error) {
      console.error('Error uploading resumes:', error)
      setError(`Error uploading resumes: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'selection', label: 'Select Files' },
      { key: 'configure', label: uploadType === 'positions' ? 'Configure Columns' : 'Upload' },
      { key: 'upload', label: 'Complete' }
    ]

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.key
                  ? 'bg-blue-600 text-white'
                  : steps.findIndex(s => s.key === currentStep) > index
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {steps.findIndex(s => s.key === currentStep) > index ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-gray-200 mx-4" />
            )}
          </div>
        ))}
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
            <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
            <p className="text-gray-600">
              {project ? `Upload files for ${project.name}` : 'Upload files for project'}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: File Selection */}
      {currentStep === 'selection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Position Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Upload Positions</span>
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing job positions. You'll be able to choose which columns to use for matching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelected={handlePositionFileSelected}
                accept=".csv,.xlsx,.xls"
                multiple={false}
                label="Supported formats: CSV, Excel (.xlsx, .xls)"
              />
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Upload Resumes</span>
              </CardTitle>
              <CardDescription>
                Upload multiple PDF resumes to match against job positions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelected={handleResumeFilesSelected}
                accept=".pdf"
                multiple={true}
                label="Supported format: PDF files only"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Column Configuration (for positions) */}
      {currentStep === 'configure' && uploadType === 'positions' && positionData && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Position Columns</CardTitle>
            <CardDescription>
              Choose which columns to use for generating embeddings and which to include in the final results.
              Found {positionData.row_count} positions with {positionData.columns?.length} columns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" onClick={handleBackToSelection}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Choose Different File
              </Button>
              
              <ColumnSelector
                columns={positionData.columns || []}
                preview={positionData.preview || []}
                onConfirm={handleColumnConfirmation}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Complete or Resume Upload */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {uploadType === 'positions' ? 'Position Upload Complete' : 'Upload Resumes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadType === 'positions' && uploadResults && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{uploadResults.message}</span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Positions saved:</strong> {uploadResults.count}</p>
                  <p><strong>Embedding columns:</strong> {uploadResults.embeddingColumns?.join(', ')}</p>
                  <p><strong>Output columns:</strong> {uploadResults.outputColumns?.join(', ')}</p>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={handleBackToProject}>
                    View Project Details
                  </Button>
                  <Button variant="outline" onClick={handleBackToSelection}>
                    Upload More Files
                  </Button>
                </div>
              </div>
            )}

            {uploadType === 'resumes' && !uploadResults && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to upload {resumeFiles.length} resume files. This may take a few minutes as we extract text and generate embeddings.
                </p>
                
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleResumeUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : `Upload ${resumeFiles.length} Resumes`}
                  </Button>
                  <Button variant="outline" onClick={handleBackToSelection}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Choose Different Files
                  </Button>
                </div>
              </div>
            )}

            {uploadType === 'resumes' && uploadResults && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{uploadResults.message}</span>
                </div>
                
                {uploadResults.results && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Upload Results:</p>
                    {uploadResults.results.map((result, index) => (
                      <div
                        key={index}
                        className={`text-sm flex items-center space-x-2 ${
                          result.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>
                          <strong>{result.filename}:</strong> {
                            result.status === 'success' 
                              ? `Uploaded successfully (${result.text_length} characters extracted)`
                              : result.message
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button onClick={handleBackToProject}>
                    View Project Details
                  </Button>
                  <Button variant="outline" onClick={handleBackToSelection}>
                    Upload More Files
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProjectUpload
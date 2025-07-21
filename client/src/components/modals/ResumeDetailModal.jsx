import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import api from '@/services/api'

function ResumeDetailModal({ isOpen, onClose, resume, projectId }) {
  const [loading, setLoading] = useState(false)
  const [resumeDetails, setResumeDetails] = useState(null)

  useEffect(() => {
    if (isOpen && resume && projectId) {
      loadResumeDetails()
    }
  }, [isOpen, resume, projectId])

  const loadResumeDetails = async () => {
    if (!resume || !projectId) return
    
    setLoading(true)
    
    try {
      // Fetch full resume details including complete extracted text
      const details = await api.getResumeDetails(projectId, resume.id)
      setResumeDetails(details)
    } catch (err) {
      console.error('Error loading resume details:', err)
      // Fall back to the basic resume data
      setResumeDetails(resume)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !resumeDetails) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {resumeDetails.filename}
            </h2>
            {resumeDetails.text_length && (
              <p className="text-sm text-gray-600 mt-1">
                {resumeDetails.text_length.toLocaleString()} characters
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Loading resume details...</span>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 min-h-[60vh]">
                <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed select-all">
                  {resumeDetails.extracted_text || 'No text extracted'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeDetailModal
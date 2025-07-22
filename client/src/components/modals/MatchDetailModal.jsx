import { useState, useEffect } from 'react'
import { X, FileText, Briefcase, Award, Download, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import api from '@/services/api'

function MatchDetailModal({ isOpen, onClose, match, projectId }) {
  const [loading, setLoading] = useState(false)
  const [resumeDetails, setResumeDetails] = useState(null)
  const [showPDF, setShowPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  useEffect(() => {
    if (isOpen && match && projectId) {
      loadResumeDetails()
    }
  }, [isOpen, match, projectId])

  const loadResumeDetails = async () => {
    if (!match || !projectId) return
    
    setLoading(true)
    
    try {
      // Fetch full resume details
      const details = await api.getResumeDetails(projectId, match.resume_id)
      setResumeDetails(details)
    } catch (err) {
      console.error('Error loading resume details:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreTextColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleTogglePDF = async () => {
    if (showPDF) {
      setShowPDF(false)
      setPdfUrl(null)
    } else {
      setPdfUrl(`${api.baseUrl}/api/resumes/${match.resume_id}/pdf`)
      setShowPDF(true)
    }
  }

  if (!isOpen || !match) return null

  const scorePercentage = Math.round(match.similarity_score * 100)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Match Details</h2>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Match Score:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreColor(match.similarity_score)}`}
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                  <span className={`font-bold text-sm ${getScoreTextColor(match.similarity_score)}`}>
                    {scorePercentage}%
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="font-mono">
                Rank #{match.rank}
              </Badge>
            </div>
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading match details...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Position Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span>Position Details</span>
                  </CardTitle>
                  <CardDescription>
                    Job position requirements and information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {match.position_data && Object.entries(match.position_data).map(([key, value]) => (
                      <div key={key} className="border-b pb-3 last:border-0">
                        <h4 className="text-sm font-medium text-gray-700 capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resume Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span>Resume Details</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePDF}
                    >
                      {showPDF ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide PDF
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View PDF
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {match.resume_filename}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showPDF && pdfUrl ? (
                    <div className="w-full h-96 border rounded">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full"
                        title="Resume PDF"
                      />
                    </div>
                  ) : resumeDetails ? (
                    <div className="space-y-4">
                      {resumeDetails.parsing_method === 'section_based' && resumeDetails.parsed_sections ? (
                        // Show parsed sections
                        Object.entries(resumeDetails.parsed_sections).map(([section, content]) => (
                          content && (
                            <div key={section} className="border-b pb-3 last:border-0">
                              <h4 className="text-sm font-medium text-gray-700 capitalize mb-1">
                                {section.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {content}
                              </p>
                            </div>
                          )
                        ))
                      ) : (
                        // Show full text
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Full Text
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                              {resumeDetails.extracted_text || 'No text available'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Resume details not available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Match ID: {match.match_id}
            </div>
            <div className="flex space-x-2">
              {/* <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Match
              </Button> */}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal
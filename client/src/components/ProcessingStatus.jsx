import React, { useState, useEffect } from 'react';
import api from '../services/api';

function ProcessingStatus({ jobId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const result = await api.getJobStatus(jobId);
        setStatus(result);
        
        if (result.status === 'completed' || result.status === 'failed') {
          onComplete(result);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 2 seconds
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'processing':
        return '⟳';
      default:
        return '○';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Processing Status</h3>
      
      <div className="flex items-center space-x-3">
        <span className={`text-2xl ${getStatusColor()}`}>
          {getStatusIcon()}
        </span>
        
        <div className="flex-1">
          <p className={`font-medium ${getStatusColor()}`}>
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </p>
          
          {status.progress !== null && status.status === 'processing' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{status.progress}%</p>
            </div>
          )}
          
          {status.error_message && (
            <p className="text-sm text-red-600 mt-2">
              Error: {status.error_message}
            </p>
          )}
          
          {status.started_at && (
            <p className="text-sm text-gray-500 mt-2">
              Started: {new Date(status.started_at).toLocaleString()}
            </p>
          )}
          
          {status.completed_at && (
            <p className="text-sm text-gray-500">
              Completed: {new Date(status.completed_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcessingStatus;
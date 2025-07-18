export const createUploadSlice = (set, get) => ({
  // Position upload state
  positionFile: null,
  positionData: null,
  positionsConfirmed: false,
  confirmedPositionsPreview: null,
  
  // Resume upload state
  resumeFiles: [],
  uploadProgress: {},
  
  // Loading states
  uploading: false,
  configuring: false,
  
  // Actions
  setPositionFile: (file) => set({ positionFile: file }),
  
  setPositionData: (data) => set({ positionData: data }),
  
  setPositionsConfirmed: (confirmed) => set({ positionsConfirmed: confirmed }),
  
  setConfirmedPositionsPreview: (preview) => set({ confirmedPositionsPreview: preview }),
  
  setResumeFiles: (files) => set({ resumeFiles: files }),
  
  addResumeFiles: (newFiles) => set((state) => ({
    resumeFiles: [...state.resumeFiles, ...newFiles]
  })),
  
  removeResumeFile: (fileId) => set((state) => ({
    resumeFiles: state.resumeFiles.filter(f => f.id !== fileId)
  })),
  
  updateUploadProgress: (fileId, progress) => set((state) => ({
    uploadProgress: {
      ...state.uploadProgress,
      [fileId]: progress
    }
  })),
  
  setUploading: (uploading) => set({ uploading }),
  setConfiguring: (configuring) => set({ configuring }),
  
  // Reset functions
  resetPositionUpload: () => set({
    positionFile: null,
    positionData: null,
    positionsConfirmed: false,
    confirmedPositionsPreview: null
  }),
  
  resetResumeUpload: () => set({
    resumeFiles: [],
    uploadProgress: {}
  }),
  
  resetAllUploads: () => set({
    positionFile: null,
    positionData: null,
    positionsConfirmed: false,
    confirmedPositionsPreview: null,
    resumeFiles: [],
    uploadProgress: {},
    uploading: false,
    configuring: false
  }),
  
  // Computed values
  getTotalUploadProgress: () => {
    const { uploadProgress, resumeFiles } = get()
    if (resumeFiles.length === 0) return 0
    
    const totalProgress = resumeFiles.reduce((sum, file) => {
      return sum + (uploadProgress[file.id] || 0)
    }, 0)
    
    return Math.round(totalProgress / resumeFiles.length)
  },
  
  getUploadedFilesCount: () => {
    const { uploadProgress, resumeFiles } = get()
    return resumeFiles.filter(file => uploadProgress[file.id] === 100).length
  }
})
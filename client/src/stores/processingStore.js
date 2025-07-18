export const createProcessingSlice = (set, get) => ({
  // Processing state
  currentJobId: null,
  processingStatus: null,
  progress: 0,
  startTime: null,
  endTime: null,
  logs: [],
  
  // Actions
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
  
  setProcessingStatus: (status) => set({ processingStatus: status }),
  
  setProgress: (progress) => set({ progress }),
  
  setStartTime: (time) => set({ startTime: time }),
  
  setEndTime: (time) => set({ endTime: time }),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, {
      ...log,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    }]
  })),
  
  clearLogs: () => set({ logs: [] }),
  
  startProcessing: (jobId) => set({
    currentJobId: jobId,
    processingStatus: 'pending',
    progress: 0,
    startTime: new Date(),
    endTime: null,
    logs: []
  }),
  
  completeProcessing: (success = true) => set({
    processingStatus: success ? 'completed' : 'failed',
    progress: 100,
    endTime: new Date()
  }),
  
  resetProcessing: () => set({
    currentJobId: null,
    processingStatus: null,
    progress: 0,
    startTime: null,
    endTime: null,
    logs: []
  }),
  
  // Computed values
  isProcessing: () => {
    const { processingStatus } = get()
    return processingStatus === 'processing' || processingStatus === 'pending'
  },
  
  getProcessingDuration: () => {
    const { startTime, endTime } = get()
    if (!startTime) return 0
    
    const end = endTime || new Date()
    return Math.round((end - startTime) / 1000) // seconds
  },
  
  getStatusColor: () => {
    const { processingStatus } = get()
    switch (processingStatus) {
      case 'completed': return 'green'
      case 'failed': return 'red'
      case 'processing': return 'blue'
      case 'pending': return 'yellow'
      default: return 'gray'
    }
  }
})
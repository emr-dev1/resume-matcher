export const createUISlice = (set, get) => ({
  // Layout state
  sidebarCollapsed: false,
  sidebarMobile: false,
  
  // Modal state
  modals: {},
  
  // Navigation state
  breadcrumbs: [],
  currentPath: '/',
  currentView: 'dashboard', // 'dashboard', 'project-detail', 'settings'
  projectDetailActiveTab: 'overview', // 'overview', 'positions', 'resumes', 'matches'
  
  // Global loading state
  globalLoading: false,
  
  // Notifications
  notifications: [],
  
  // Theme
  theme: 'light',
  
  // Actions
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setSidebarMobile: (open) => set({ sidebarMobile: open }),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  openModal: (modalId, props = {}) => set((state) => ({
    modals: {
      ...state.modals,
      [modalId]: { open: true, props }
    }
  })),
  
  closeModal: (modalId) => set((state) => ({
    modals: {
      ...state.modals,
      [modalId]: { ...state.modals[modalId], open: false }
    }
  })),
  
  closeAllModals: () => set({ modals: {} }),
  
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  
  setCurrentPath: (path) => set({ currentPath: path }),
  
  setCurrentView: (view) => set({ currentView: view }),
  
  setProjectDetailActiveTab: (tab) => set({ projectDetailActiveTab: tab }),
  
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  addNotification: (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
      timestamp: new Date()
    }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setTheme: (theme) => set({ theme }),
  
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
  
  // Computed values
  isModalOpen: (modalId) => {
    const { modals } = get()
    return modals[modalId]?.open || false
  },
  
  getModalProps: (modalId) => {
    const { modals } = get()
    return modals[modalId]?.props || {}
  },
  
  // Helper functions for common UI actions
  showSuccess: (message, title = 'Success') => {
    get().addNotification({
      type: 'success',
      title,
      message
    })
  },
  
  showError: (message, title = 'Error') => {
    get().addNotification({
      type: 'error',
      title,
      message,
      duration: 0 // Don't auto-dismiss errors
    })
  },
  
  showWarning: (message, title = 'Warning') => {
    get().addNotification({
      type: 'warning',
      title,
      message
    })
  },
  
  showInfo: (message, title = 'Info') => {
    get().addNotification({
      type: 'info',
      title,
      message
    })
  },
  
  // Reset function
  resetUI: () => set({
    sidebarCollapsed: false,
    sidebarMobile: false,
    modals: {},
    breadcrumbs: [],
    currentPath: '/',
    currentView: 'dashboard',
    projectDetailActiveTab: 'overview',
    globalLoading: false,
    notifications: []
  })
})
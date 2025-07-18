export const createProjectSlice = (set, get) => ({
  // State
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,

  // Actions
  setProjects: (projects) => set({ projects }),
  
  setSelectedProject: (project) => set({ selectedProject: project }),
  
  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects]
  })),
  
  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    ),
    selectedProject: state.selectedProject?.id === projectId 
      ? { ...state.selectedProject, ...updates }
      : state.selectedProject
  })),
  
  removeProject: (projectId) => set((state) => ({
    projects: state.projects.filter(p => p.id !== projectId),
    selectedProject: state.selectedProject?.id === projectId 
      ? null 
      : state.selectedProject
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Computed values
  getProjectById: (projectId) => {
    const { projects } = get()
    return projects.find(p => p.id === parseInt(projectId))
  },
  
  clearProjects: () => set({
    projects: [],
    selectedProject: null,
    loading: false,
    error: null
  })
})
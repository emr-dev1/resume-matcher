export const createResultsSlice = (set, get) => ({
  // Results state
  matches: [],
  filteredMatches: [],
  selectedMatch: null,
  
  // Table state
  sortBy: 'rank',
  sortOrder: 'asc',
  currentPage: 1,
  pageSize: 50,
  
  // Filters
  searchQuery: '',
  scoreRange: [0, 1],
  positionFilter: '',
  rankFilter: '',
  
  // Loading states
  loadingMatches: false,
  loadingMatchDetails: false,
  exporting: false,
  
  // Actions
  setMatches: (matches) => {
    set({ matches })
    get().applyFilters()
  },
  
  setSelectedMatch: (match) => set({ selectedMatch: match }),
  
  setSortBy: (sortBy) => {
    set({ sortBy })
    get().applySort()
  },
  
  setSortOrder: (order) => {
    set({ sortOrder: order })
    get().applySort()
  },
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setPageSize: (size) => set({ 
    pageSize: size,
    currentPage: 1 // Reset to first page when changing page size
  }),
  
  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 })
    get().applyFilters()
  },
  
  setScoreRange: (range) => {
    set({ scoreRange: range, currentPage: 1 })
    get().applyFilters()
  },
  
  setPositionFilter: (filter) => {
    set({ positionFilter: filter, currentPage: 1 })
    get().applyFilters()
  },
  
  setRankFilter: (filter) => {
    set({ rankFilter: filter, currentPage: 1 })
    get().applyFilters()
  },
  
  // Filter and sort logic
  applyFilters: () => {
    const { 
      matches, 
      searchQuery, 
      scoreRange, 
      positionFilter, 
      rankFilter 
    } = get()
    
    let filtered = [...matches]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(match => 
        match.resume_filename?.toLowerCase().includes(query) ||
        Object.values(match.position_data || {}).some(value =>
          String(value).toLowerCase().includes(query)
        )
      )
    }
    
    // Score range filter
    filtered = filtered.filter(match => 
      match.similarity_score >= scoreRange[0] && 
      match.similarity_score <= scoreRange[1]
    )
    
    // Position filter
    if (positionFilter) {
      filtered = filtered.filter(match => 
        match.position_id === parseInt(positionFilter)
      )
    }
    
    // Rank filter
    if (rankFilter) {
      const rank = parseInt(rankFilter)
      filtered = filtered.filter(match => match.rank <= rank)
    }
    
    set({ filteredMatches: filtered })
    get().applySort()
  },
  
  applySort: () => {
    const { filteredMatches, sortBy, sortOrder } = get()
    
    const sorted = [...filteredMatches].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
    
    set({ filteredMatches: sorted })
  },
  
  // Loading states
  setLoadingMatches: (loading) => set({ loadingMatches: loading }),
  setLoadingMatchDetails: (loading) => set({ loadingMatchDetails: loading }),
  setExporting: (exporting) => set({ exporting }),
  
  // Reset functions
  resetFilters: () => {
    set({
      searchQuery: '',
      scoreRange: [0, 1],
      positionFilter: '',
      rankFilter: '',
      currentPage: 1
    })
    get().applyFilters()
  },
  
  resetResults: () => set({
    matches: [],
    filteredMatches: [],
    selectedMatch: null,
    sortBy: 'rank',
    sortOrder: 'asc',
    currentPage: 1,
    pageSize: 50,
    searchQuery: '',
    scoreRange: [0, 1],
    positionFilter: '',
    rankFilter: '',
    loadingMatches: false,
    loadingMatchDetails: false,
    exporting: false
  }),
  
  // Computed values
  getPaginatedMatches: () => {
    const { filteredMatches, currentPage, pageSize } = get()
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredMatches.slice(startIndex, endIndex)
  },
  
  getTotalPages: () => {
    const { filteredMatches, pageSize } = get()
    return Math.ceil(filteredMatches.length / pageSize)
  },
  
  getMatchById: (matchId) => {
    const { matches } = get()
    return matches.find(m => m.match_id === parseInt(matchId))
  },
  
  getUniquePositions: () => {
    const { matches } = get()
    const positions = matches.reduce((acc, match) => {
      if (!acc.find(p => p.id === match.position_id)) {
        acc.push({
          id: match.position_id,
          data: match.position_data
        })
      }
      return acc
    }, [])
    return positions
  }
})
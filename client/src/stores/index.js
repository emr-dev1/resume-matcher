import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createProjectSlice } from './projectStore'
import { createUploadSlice } from './uploadStore'
import { createProcessingSlice } from './processingStore'
import { createResultsSlice } from './resultsStore'
import { createUISlice } from './uiStore'

// Individual stores
export const useProjectStore = create()(
  devtools(
    createProjectSlice,
    { name: 'project-store' }
  )
)

export const useUploadStore = create()(
  devtools(
    createUploadSlice,
    { name: 'upload-store' }
  )
)

export const useProcessingStore = create()(
  devtools(
    createProcessingSlice,
    { name: 'processing-store' }
  )
)

export const useResultsStore = create()(
  devtools(
    createResultsSlice,
    { name: 'results-store' }
  )
)

export const useUIStore = create()(
  devtools(
    createUISlice,
    { name: 'ui-store' }
  )
)

// Export default store
export { useProjectStore as default }
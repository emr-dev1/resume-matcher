import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import ProjectDetail from '@/pages/ProjectDetail'
import ProjectUpload from '@/pages/ProjectUpload'
import ProjectProcess from '@/pages/ProjectProcess'
import ProjectConfigure from '@/pages/ProjectConfigure'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import { useUIStore } from '@/stores'

function App() {
  const { currentView } = useUIStore()

  const renderCurrentView = () => {
    switch (currentView) {
      case 'project-detail':
        return <ProjectDetail />
      case 'project-upload':
        return <ProjectUpload />
      case 'project-process':
        return <ProjectProcess />
      case 'project-configure':
        return <ProjectConfigure />
      case 'settings':
        return <Settings />
      case 'not-found':
        return <NotFound />
      case 'dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout>
      {renderCurrentView()}
    </Layout>
  )
}

export default App

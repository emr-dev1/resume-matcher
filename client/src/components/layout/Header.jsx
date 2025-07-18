import { Menu, Bell, User } from 'lucide-react'
import { useUIStore } from '@/stores'
import Button from '@/components/ui/Button'

function Header() {
  const { setSidebarMobile } = useUIStore()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left side - Mobile menu + Title */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarMobile(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Page title */}
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User menu */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-medium">User</span>
        </Button>
      </div>
    </header>
  )
}

export default Header
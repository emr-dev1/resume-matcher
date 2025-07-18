import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Settings panel coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
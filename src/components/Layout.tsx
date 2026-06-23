import { Outlet } from 'react-router-dom'
import { AppSidebar } from './layout/AppSidebar'
import { Header } from './layout/Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AppSidebar className="fixed w-64" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
import { AppSidebar } from './layout/AppSidebar'
import { Header } from './layout/Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50/50 print:bg-white print:block">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 print:hidden">
        <AppSidebar className="fixed w-64 print:hidden" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden print:p-0 print:overflow-visible print:block">
          <div
            className="mx-auto max-w-7xl animate-fade-in-up print:max-w-none print:m-0 print:block print:transform-none"
            style={{ animationDelay: '100ms' }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

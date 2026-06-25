import { Outlet } from 'react-router-dom'
import { AppSidebar } from './layout/AppSidebar'
import { Header } from './layout/Header'
import { AuroChatPanel } from '@/components/auro/AuroChatPanel'
import { useAuro } from '@/hooks/use-auro'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { isOpen } = useAuro()

  return (
    <div className="flex min-h-screen bg-gray-50/50 print:bg-white print:block overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 print:hidden">
        <AppSidebar className="fixed w-64 h-full print:hidden" />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 print:block transition-all duration-300',
          isOpen ? 'lg:mr-[400px]' : '',
        )}
      >
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

      {/* Auro Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l shadow-2xl transition-transform duration-300 z-[60] transform',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <AuroChatPanel />
      </div>
    </div>
  )
}

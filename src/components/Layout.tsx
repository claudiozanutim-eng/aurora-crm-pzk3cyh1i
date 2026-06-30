import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Header } from '@/components/layout/Header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AuroChatPanel } from '@/components/auro/AuroChatPanel'
import { useAuro } from '@/hooks/use-auro'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isOpen, setIsOpen } = useAuro()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden lg:block w-52 shrink-0">
        <AppSidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col">
          <AuroChatPanel />
        </SheetContent>
      </Sheet>
    </div>
  )
}

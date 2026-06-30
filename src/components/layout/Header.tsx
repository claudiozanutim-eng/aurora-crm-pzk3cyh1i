import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { Notifications } from '@/components/layout/Notifications'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
        <div className="flex-1 max-w-md">
          <GlobalSearch />
        </div>
      </div>
      <Notifications />
    </header>
  )
}

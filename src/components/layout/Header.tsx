import { Bell, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'
import { useState } from 'react'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Buscar em todo o CRM..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-primary focus-visible:border-primary transition-all rounded-full"
            />
          </div>
        </form>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative text-gray-500 hover:text-primary hover:bg-primary/10"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          <span className="sr-only">Notificações</span>
        </Button>
      </div>
    </header>
  )
}

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Target,
  KanbanSquare,
  CheckSquare,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import auroraLogoHorizontal from '@/assets/image69debc47-caaa-4a34-9b6b-8da340b6c9e7-53707.png'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Prospecção', href: '/prospeccao', icon: Target },
  { name: 'Funil de Vendas', href: '/funil', icon: KanbanSquare },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Propostas', href: '/propostas', icon: FileText },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

interface AppSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const location = useLocation()

  return (
    <div className={cn('flex h-full w-full flex-col bg-white border-r', className)}>
      <div className="flex h-24 shrink-0 items-center px-6 border-b">
        <Link to="/" className="flex items-center" onClick={onNavigate}>
          <img
            src={auroraLogoHorizontal}
            alt="Aurora CRM"
            className="h-[72px] w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon
                className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : 'text-gray-400')}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1"
            alt="User profile"
            className="h-8 w-8 rounded-full border border-gray-200"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Ana Gerente</span>
            <span className="text-xs text-gray-500">IC Educ</span>
          </div>
        </div>
      </div>
    </div>
  )
}

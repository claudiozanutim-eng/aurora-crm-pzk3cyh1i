import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Users,
  Contact,
  Target,
  KanbanSquare,
  CheckSquare,
  FileText,
  Settings,
  UserCog,
  LogOut,
  BarChart,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuro } from '@/hooks/use-auro'
import pb from '@/lib/pocketbase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import auroraLogoHorizontal from '@/assets/image69debc47-caaa-4a34-9b6b-8da340b6c9e7-53707.png'
import { AuroAvatar } from '@/components/auro/AuroAvatar'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Contatos', href: '/contatos', icon: Contact },
  { name: 'Prospecção', href: '/prospeccao', icon: Target },
  { name: 'Funil de Vendas', href: '/funil', icon: KanbanSquare },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Propostas', href: '/propostas', icon: FileText },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, adminOnly: true },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

interface AppSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { setIsOpen } = useAuro()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className={cn('flex h-full w-full flex-col bg-white border-r', className)}>
      <div className="flex h-20 shrink-0 items-center px-4 border-b">
        <Link to="/" className="flex items-center w-full" onClick={onNavigate}>
          <img
            src={auroraLogoHorizontal}
            alt="Aurora CRM"
            className="h-[132px] w-auto max-w-full object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          if (item.adminOnly && user?.perfil !== 'Admin') return null

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
        <div className="pt-6 mt-4 border-t border-gray-100 flex justify-center pb-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center gap-3 px-2 py-4 rounded-xl transition-all duration-300 w-[90%] group hover:bg-orange-50/50"
          >
            <AuroAvatar
              className="h-[60px] w-[60px] transition-all duration-300"
              imageClassName="group-hover:scale-110 transition-transform duration-500"
            />
            <span className="text-sm font-bold text-gray-600 group-hover:text-[#F97316] transition-colors duration-300 text-center leading-tight">
              Auro - O Assistente
            </span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
            <AvatarImage
              src={user?.avatar ? pb.files.getURL(user, user.avatar) : undefined}
              alt={user?.name || 'User profile'}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {user?.name?.trim()
                ? user.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuário'}
            </span>
            <span className="text-xs text-gray-500 truncate">IC Educ</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10 shrink-0"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sair</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  Briefcase,
  DollarSign,
  Target,
  Receipt,
  Percent,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export interface KpiData {
  totalClientes: number
  leadsAtivos: number
  negociosAndamento: number
  valorTotalPipeline: number
  valorPonderadoPipeline: number
  taxaConversao: number
  ticketMedio: number
  valorTotalGanhos: number
  valorTotalPerdidos: number
}

interface DashboardKpisProps {
  data: KpiData
  loading: boolean
}

export function DashboardKpis({ data, loading }: DashboardKpisProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const kpiConfig = [
    {
      title: 'Valor Total de Ganhos',
      value: formatCurrency(data.valorTotalGanhos),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Valor Total do Pipeline',
      value: formatCurrency(data.valorTotalPipeline),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Valor Ponderado',
      value: formatCurrency(data.valorPonderadoPipeline),
      icon: Target,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'Taxa de Conversão',
      value: `${data.taxaConversao.toFixed(1)}%`,
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.ticketMedio),
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
    },
    {
      title: 'Valor Total de Perdidos',
      value: formatCurrency(data.valorTotalPerdidos),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Negócios em Andamento',
      value: data.negociosAndamento,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Leads Ativos',
      value: data.leadsAtivos,
      icon: UserPlus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total de Clientes',
      value: data.totalClientes,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiConfig.map((item) => {
        const Icon = item.icon
        return (
          <Card
            key={item.title}
            className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group rounded-xl"
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">{item.title}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">{item.value}</p>
                  )}
                </div>
                <div className={cn('p-2 rounded-lg transition-colors', item.bgColor)}>
                  <Icon className={cn('h-5 w-5', item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

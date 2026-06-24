import { Card, CardContent } from '@/components/ui/card'
import { Users, UserPlus, Briefcase, DollarSign, Target, Receipt, Percent } from 'lucide-react'
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
      title: 'Total de Clientes',
      value: data.totalClientes,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Leads Ativos',
      value: data.leadsAtivos,
      icon: UserPlus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Negócios em Andamento',
      value: data.negociosAndamento,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
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
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {kpiConfig.map((item, index) => {
        const Icon = item.icon
        return (
          <Card
            key={item.title}
            className="border-gray-100 shadow-subtle hover:shadow-elevation transition-all duration-200 group"
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

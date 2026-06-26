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
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val) || 0)
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
      tooltip:
        'O valor ponderado é o valor total do seu pipeline de vendas considerando a probabilidade de fechamento de cada negócio. Por exemplo: se você tem um negócio de R$ 100.000 com 50% de chance de fechar, ele contribui com R$ 50.000 para esse indicador. Somamos todos os negócios abertos multiplicados pela sua probabilidade de fechamento.',
    },
    {
      title: 'Win Rate',
      value: `${data.taxaConversao.toFixed(1)}%`,
      icon: Percent,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-100',
      tooltip:
        'O Win Rate mede sua eficiência comercial. Calculamos dividindo o número de negócios ganhos pelo total de negócios que já concluíram o ciclo (ganhos + perdidos). Por exemplo: se você fechou 3 negócios e perdeu 3, seu Win Rate é de 50%.',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.ticketMedio),
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      tooltip:
        'O ticket médio é o valor médio dos negócios que você fechou com sucesso. Calculamos dividindo o valor total dos negócios ganhos pela quantidade de negócios ganhos.',
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
    <TooltipProvider delayDuration={0}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiConfig.map((item) => {
          const Icon = item.icon

          return (
            <Card
              key={item.title}
              className={cn(
                'bg-white shadow-sm hover:shadow-md transition-all duration-200 group rounded-xl relative',
                item.borderColor || 'border-gray-100',
              )}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-500">{item.title}</p>
                      {item.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex cursor-help focus:outline-none"
                            >
                              <Info className="h-4 w-4 text-[#e55320]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            sideOffset={4}
                            className="max-w-[300px] bg-white text-black border border-gray-200 shadow-md z-50"
                          >
                            <p className="text-xs font-normal leading-relaxed">{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 tracking-tight">
                        {item.value}
                      </p>
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
    </TooltipProvider>
  )
}

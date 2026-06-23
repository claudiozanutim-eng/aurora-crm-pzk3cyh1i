import { Card, CardContent } from '@/components/ui/card'
import { Users, UserPlus, Briefcase, TrendingUp, DollarSign } from 'lucide-react'
import { kpiData } from '@/data/mock-data'
import { cn } from '@/lib/utils'

const kpiConfig = [
  {
    title: 'Total de Clientes',
    data: kpiData.totalClients,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Leads Ativos',
    data: kpiData.activeLeads,
    icon: UserPlus,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Negócios em Andamento',
    data: kpiData.ongoingDeals,
    icon: Briefcase,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    title: 'Taxa de Conversão',
    data: kpiData.conversionRate,
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    title: 'Valor Total no Pipeline',
    data: kpiData.pipelineValue,
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {item.data.value}
                  </p>
                </div>
                <div className={cn('p-2 rounded-lg transition-colors', item.bgColor)}>
                  <Icon className={cn('h-5 w-5', item.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span
                  className={cn(
                    'font-medium px-2 py-0.5 rounded-full text-xs',
                    item.data.isPositive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-rose-700 bg-rose-50',
                  )}
                >
                  {item.data.trend}
                </span>
                <span className="text-gray-400 ml-2 text-xs">desde o último mês</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardChartsProps {
  data: {
    negocios: any[]
    negociosAll: any[]
  }
  period: string
  loading: boolean
}

const funnelStages = [
  'Prospecção',
  'Qualificação',
  'Proposta Enviada',
  'Negociação',
  'Fechado/Ganho',
  'Perdido',
]

const chartConfig = {
  volume: {
    label: 'Volume de Negócios',
    color: '#f97316', // IC Educ Orange
  },
  valor: {
    label: 'Valor (R$)',
    color: '#f97316',
  },
}

export function DashboardCharts({ data, period, loading }: DashboardChartsProps) {
  const funnelData = useMemo(() => {
    if (!data.negocios) return []
    return funnelStages.map((stage) => {
      const count = data.negocios.filter((n) => n.status === stage).length
      return {
        stage,
        volume: count,
      }
    })
  }, [data.negocios])

  const evolutionData = useMemo(() => {
    if (!data.negociosAll) return []
    const wonDeals = data.negociosAll.filter(
      (n) => n.status === 'Fechado/Ganho' && n.data_fechamento_real,
    )

    // Group by month
    const grouped = wonDeals.reduce(
      (acc, deal) => {
        const date = parseISO(deal.data_fechamento_real)
        const monthYear = format(date, 'MMM/yy', { locale: ptBR })
        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, valor: 0, date }
        }
        acc[monthYear].valor += deal.valor_estimado || 0
        return acc
      },
      {} as Record<string, { month: string; valor: number; date: Date }>,
    )

    return Object.values(grouped)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12)
  }, [data.negociosAll])

  if (loading) {
    return (
      <>
        <Card className="shadow-subtle border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-gray-400">
            Carregando funil...
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Evolução de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-gray-400">
            Carregando evolução...
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card className="shadow-subtle border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  width={120}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="volume"
                  fill="var(--color-volume)"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  label={{ position: 'right', fill: '#6b7280', fontSize: 12 }}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Evolução de Vendas (Ganhos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {evolutionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Nenhum negócio ganho no período selecionado.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                  data={evolutionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(value)
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="valor"
                    fill="var(--color-valor)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

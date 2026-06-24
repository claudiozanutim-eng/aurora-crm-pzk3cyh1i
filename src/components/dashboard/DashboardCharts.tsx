import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardChartsProps {
  data: {
    negocios: any[]
    negociosAll: any[]
    year?: number
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

    const targetYear = data.year || new Date().getFullYear()

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(targetYear, i, 1)
      return {
        month: format(date, 'MMM/yy', { locale: ptBR }),
        valor: 0,
      }
    })

    const wonDeals = data.negociosAll.filter(
      (n) => n.status === 'Fechado/Ganho' && n.data_fechamento_real,
    )

    wonDeals.forEach((deal) => {
      const date = parseISO(deal.data_fechamento_real)
      if (date.getFullYear() === targetYear) {
        const monthIndex = date.getMonth()
        months[monthIndex].valor += deal.valor_estimado || 0
      }
    })

    return months
  }, [data.negociosAll, data.year])

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
                  margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
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
                  <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} barSize={32}>
                    <LabelList
                      dataKey="valor"
                      position="top"
                      formatter={(value: number) =>
                        value > 0
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              maximumFractionDigits: 0,
                            }).format(value)
                          : ''
                      }
                      fill="#4b5563"
                      fontSize={11}
                      fontWeight={500}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

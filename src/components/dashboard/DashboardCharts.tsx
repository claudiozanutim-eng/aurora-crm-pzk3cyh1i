import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Link } from 'react-router-dom'

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
    color: '#f97316',
  },
  valor: {
    label: 'Valor (R$)',
    color: '#f97316',
  },
  valorPrev: {
    label: 'Ano Anterior (R$)',
    color: '#9ca3af',
  },
}

export function DashboardCharts({ data, period, loading }: DashboardChartsProps) {
  const [compareYear, setCompareYear] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<{
    month: number
    year: number
    label: string
  } | null>(null)

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

  const targetYear = data.year || new Date().getFullYear()
  const prevYear = targetYear - 1

  const evolutionData = useMemo(() => {
    if (!data.negociosAll) return []

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(targetYear, i, 1)
      return {
        monthIndex: i,
        month: format(date, 'MMM/yy', { locale: ptBR }),
        monthShort: format(date, 'MMM', { locale: ptBR }),
        valor: 0,
        valorPrev: 0,
      }
    })

    const wonDeals = data.negociosAll.filter(
      (n) => n.status === 'Fechado/Ganho' && n.data_fechamento_real,
    )

    wonDeals.forEach((deal) => {
      const date = parseISO(deal.data_fechamento_real)
      const dealYear = date.getFullYear()
      const monthIndex = date.getMonth()

      if (dealYear === targetYear) {
        months[monthIndex].valor += Number(deal.valor_estimado) || 0
      } else if (dealYear === prevYear) {
        months[monthIndex].valorPrev += Number(deal.valor_estimado) || 0
      }
    })

    return months
  }, [data.negociosAll, targetYear, prevYear])

  const selectedDeals = useMemo(() => {
    if (!selectedMonth || !data.negociosAll) return []
    return data.negociosAll
      .filter((n) => {
        if (n.status !== 'Fechado/Ganho' || !n.data_fechamento_real) return false
        const d = parseISO(n.data_fechamento_real)
        return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month
      })
      .sort(
        (a, b) =>
          new Date(b.data_fechamento_real).getTime() - new Date(a.data_fechamento_real).getTime(),
      )
  }, [selectedMonth, data.negociosAll])

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

  const formatCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)

  const hasEvolutionData = evolutionData.some((d) => d.valor > 0 || d.valorPrev > 0)

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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Evolução de Vendas (Ganhos)
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="compare-year"
              checked={compareYear}
              onCheckedChange={setCompareYear}
              className="data-[state=checked]:bg-orange-500"
            />
            <Label
              htmlFor="compare-year"
              className="text-sm font-medium text-gray-600 cursor-pointer select-none"
            >
              Comparar com ano anterior ({prevYear})
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {!hasEvolutionData ? (
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
                    dataKey={compareYear ? 'monthShort' : 'month'}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          const label =
                            name === 'valorPrev' ? `Ano ${prevYear}` : `Ano ${targetYear}`
                          return [formatCurrency(value), label]
                        }}
                      />
                    }
                  />
                  {compareYear && (
                    <Bar
                      dataKey="valorPrev"
                      fill="var(--color-valorPrev)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      cursor="pointer"
                      onClick={(data: any) =>
                        setSelectedMonth({
                          month: data.monthIndex,
                          year: prevYear,
                          label: `${data.monthShort}/${prevYear}`,
                        })
                      }
                    >
                      <LabelList
                        dataKey="valorPrev"
                        position="top"
                        formatter={(value: number) => (value > 0 ? formatCompact(value) : '')}
                        fill="#6b7280"
                        fontSize={10}
                        fontWeight={500}
                      />
                    </Bar>
                  )}
                  <Bar
                    dataKey="valor"
                    fill="var(--color-valor)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    cursor="pointer"
                    onClick={(data: any) =>
                      setSelectedMonth({
                        month: data.monthIndex,
                        year: targetYear,
                        label: `${data.monthShort}/${targetYear}`,
                      })
                    }
                  >
                    <LabelList
                      dataKey="valor"
                      position="top"
                      formatter={(value: number) => (value > 0 ? formatCompact(value) : '')}
                      fill="#4b5563"
                      fontSize={10}
                      fontWeight={500}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
            <p className="text-xs text-gray-400 text-center mt-2">
              Clique nas barras para ver os detalhes do mês.
            </p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Negócios Ganhos - {selectedMonth?.label}</SheetTitle>
            <SheetDescription>
              Detalhamento de todos os negócios com status "Fechado/Ganho" no período.
            </SheetDescription>
          </SheetHeader>

          {selectedDeals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              Nenhum negócio fechado neste período.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDeals.map((deal) => (
                    <TableRow key={deal.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium max-w-[150px] truncate">
                        <Link
                          to={`/clientes/${deal.cliente_id}`}
                          className="text-orange-600 hover:underline"
                        >
                          {deal.expand?.cliente_id?.nome || 'Cliente Desconhecido'}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={deal.descricao}>
                        <Link
                          to={`/clientes/${deal.cliente_id}`}
                          className="text-gray-700 hover:text-orange-600"
                        >
                          {deal.descricao || 'Sem descrição'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {deal.expand?.vendedor_id?.name || deal.expand?.vendedor_id?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {format(parseISO(deal.data_fechamento_real), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(Number(deal.valor_estimado) || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

import React, { useMemo, useState } from 'react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Link } from 'react-router-dom'
import { XCircle, TrendingDown, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardChartsProps {
  data: {
    negocios: any[]
    negociosAll: any[]
    leads: any[]
    year?: number
  }
  period: string
  loading: boolean
}

const chartConfig = {
  valorPrev: {
    label: 'Ano Anterior (R$)',
    color: '#9ca3af',
  },
  valor: {
    label: 'Valor (R$)',
    color: '#f97316',
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

    const prospeccao = data.negocios.filter((n) => n.status === 'Prospecção')
    const qualificacao = data.negocios.filter((n) => n.status === 'Qualificação')
    const propostaEnviada = data.negocios.filter((n) => n.status === 'Proposta Enviada')
    const negociacao = data.negocios.filter((n) => n.status === 'Negociação')
    const ganhos = data.negocios.filter((n) => n.status === 'Fechado/Ganho')
    const perdidos = data.negocios.filter((n) => n.status === 'Perdido')

    const stages = [
      { stage: 'Prospecção', items: prospeccao },
      { stage: 'Qualificação', items: qualificacao },
      { stage: 'Proposta Enviada', items: propostaEnviada },
      { stage: 'Negociação', items: negociacao },
      { stage: 'Fechado/Ganho', items: ganhos },
      { stage: 'Perdido', items: perdidos },
    ]

    const maxCount = Math.max(...stages.map((s) => s.items.length), 1)

    const stageColors = [
      'bg-slate-400',
      'bg-indigo-400',
      'bg-blue-400',
      'bg-cyan-400',
      'bg-emerald-500',
      'bg-red-400',
    ]

    return stages.map((s, idx) => {
      const count = s.items.length
      const value = s.items.reduce((acc, n) => acc + (Number(n.valor_estimado) || 0), 0)

      const widthPct = Math.max(2, (count / maxCount) * 100)

      return {
        stage: s.stage,
        count,
        value,
        color: stageColors[idx],
        width: `${widthPct}%`,
      }
    })
  }, [data.negocios])

  const lostDealsInfo = useMemo(() => {
    const negocios = data.negocios || []
    const lost = negocios.filter((n) => n.status === 'Perdido')
    const count = lost.length
    const value = lost.reduce((acc, n) => acc + (Number(n.valor_estimado) || 0), 0)
    const reasonsMap = lost.reduce(
      (acc, n) => {
        const r = n.motivo_perda || 'Não informado'
        acc[r] = (acc[r] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topReasons = Object.entries(reasonsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    const wonCount = negocios.filter((n) => n.status === 'Fechado/Ganho').length

    const totalQualified = negocios.filter((n) =>
      ['Qualificação', 'Proposta Enviada', 'Negociação', 'Fechado/Ganho', 'Perdido'].includes(
        n.status,
      ),
    ).length

    const topToBottom =
      totalQualified > 0
        ? new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format((wonCount / totalQualified) * 100)
        : '0,0'

    return { count, value, topReasons, topToBottom }
  }, [data.negocios, funnelData])

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
        valorPrev: 0,
        valor: 0,
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

  if (loading) {
    return (
      <>
        <Card className="shadow-subtle border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center text-gray-400">
            Carregando pipeline...
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-gray-100 lg:col-span-2">
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

  const hasEvolutionData = evolutionData.some((d) => d.valor > 0 || d.valorPrev > 0)

  return (
    <>
      <Card className="shadow-subtle border-gray-100 lg:col-span-2">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Pipeline de Vendas
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200/60 shadow-sm cursor-help">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-wide">
                    Conversão (Ganhos/Qualif.): {lostDealsInfo.topToBottom}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Percentual de negócios ganhos em relação aos que atingiram a etapa de qualificação
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Funnel Area */}
            <div className="lg:col-span-2 flex flex-col justify-center py-4 px-2 relative space-y-4 w-full">
              {funnelData.map((item) => {
                return (
                  <div key={item.stage} className="flex items-center gap-4 w-full max-w-full">
                    {/* Left Column: Label */}
                    <div className="w-32 sm:w-40 flex-shrink-0 text-right">
                      <span
                        className="font-semibold text-sm text-gray-700 truncate block"
                        title={item.stage}
                      >
                        {item.stage}
                      </span>
                    </div>

                    {/* Right Column: Proportional Bar & Data */}
                    <div className="flex-1 flex items-center gap-3 overflow-hidden pr-2">
                      <div
                        className={cn(
                          'h-10 rounded-md shadow-sm transition-all duration-500 hover:opacity-90',
                          item.color,
                        )}
                        style={{ width: item.width }}
                      />
                      <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap text-gray-700 flex-shrink-0">
                        <span className="font-bold min-w-[24px] text-center bg-gray-100 rounded px-1.5 py-0.5">
                          {item.count}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Lost Deals Sidebar */}
            <div className="bg-red-50/40 rounded-2xl p-5 border border-red-100 flex flex-col h-full shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                <TrendingDown className="w-32 h-32 text-red-600" />
              </div>
              <h3 className="font-bold text-red-900 mb-5 flex items-center gap-2 relative z-10">
                <XCircle className="w-5 h-5 text-red-500" />
                Negócios Perdidos
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-white/80 rounded-xl p-3 border border-red-100/50">
                  <div className="text-red-500/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Quantidade
                  </div>
                  <div className="text-2xl font-black text-gray-900">{lostDealsInfo.count}</div>
                </div>
                <div className="bg-white/80 rounded-xl p-3 border border-red-100/50 overflow-hidden">
                  <div className="text-red-500/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Valor Perdido
                  </div>
                  <div
                    className="text-xl font-black text-gray-900 truncate"
                    title={formatCurrency(lostDealsInfo.value)}
                  >
                    {formatCompact(lostDealsInfo.value)}
                  </div>
                </div>
              </div>

              <div className="flex-1 relative z-10">
                <h4 className="text-[11px] font-bold text-red-800/80 uppercase tracking-wider mb-3">
                  Principais Motivos
                </h4>
                {lostDealsInfo.topReasons.length > 0 ? (
                  <div className="space-y-3.5">
                    {lostDealsInfo.topReasons.map(([reason, count]) => (
                      <div key={reason} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium truncate pr-2">{reason}</span>
                          <span className="font-bold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{ width: `${(count / lostDealsInfo.count) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic bg-white/50 p-3 rounded-lg border border-red-50 text-center">
                    Nenhum dado registrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100 lg:col-span-2">
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
                    itemSorter={(item) => (item.dataKey === 'valorPrev' ? 1 : 2)}
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
                  <Bar
                    dataKey="valorPrev"
                    hide={!compareYear}
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

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Link } from 'react-router-dom'
import { XCircle, TrendingDown, Target, Trophy } from 'lucide-react'
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

const funnelColors = [
  'bg-slate-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
]

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
    if (!data.negocios || !data.leads) return []

    const novosLeads = data.leads.filter((l) => l.status === 'Novos Leads')
    const leadsConvertidos = data.leads.filter((l) => l.status === 'Convertido')
    const qualificacao = data.negocios.filter((n) => n.status === 'Qualificação')
    const propostaEnviada = data.negocios.filter((n) => n.status === 'Proposta Enviada')
    const negociacao = data.negocios.filter((n) => n.status === 'Negociação')
    const ganhos = data.negocios.filter((n) => n.status === 'Fechado/Ganho')

    const stages = [
      { stage: 'Novos Leads', items: novosLeads, isLead: true },
      { stage: 'Leads Convertidos', items: leadsConvertidos, isLead: true },
      { stage: 'Qualificação', items: qualificacao, isLead: false },
      { stage: 'Proposta Enviada', items: propostaEnviada, isLead: false },
      { stage: 'Negociação', items: negociacao, isLead: false },
      { stage: 'Ganhos', items: ganhos, isLead: false },
    ]

    const maxCount = Math.max(...stages.map((s) => s.items.length), 1)

    return stages.map((s, idx) => {
      const count = s.items.length
      const value = s.isLead
        ? 0
        : s.items.reduce((acc, n) => acc + (Number(n.valor_estimado) || 0), 0)

      const widthPct = Math.max(30, (count / maxCount) * 100)

      return {
        stage: s.stage,
        count,
        value,
        color: funnelColors[idx],
        width: `${widthPct}%`,
        isLead: s.isLead,
      }
    })
  }, [data.negocios, data.leads])

  const lostDealsInfo = useMemo(() => {
    const lost = (data.negocios || []).filter((n) => n.status === 'Perdido')
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

    const wonCount = funnelData.length > 5 ? funnelData[5].count : 0
    const totalFinished = wonCount + count
    const winRate = totalFinished > 0 ? Math.round((wonCount / totalFinished) * 100) : 0

    const topToBottom =
      funnelData.length > 0 && funnelData[0].count > 0
        ? new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format((wonCount / funnelData[0].count) * 100)
        : '0,0'

    return { count, value, topReasons, winRate, topToBottom }
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800">Pipeline de Vendas</CardTitle>
          <div
            className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200/60 shadow-sm"
            title="Taxa de conversão (Novos Leads para Ganhos)"
          >
            <Target className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">
              Conversão: {lostDealsInfo.topToBottom}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Funnel Area */}
            <div className="lg:col-span-2 flex flex-col justify-center py-2 relative">
              <div className="w-full max-w-lg mx-auto flex flex-col items-center mt-2 lg:mt-2">
                {funnelData.map((item, idx) => {
                  const prevItem = idx > 0 ? funnelData[idx - 1] : null
                  const convRate =
                    prevItem && prevItem.count > 0
                      ? Math.round((item.count / prevItem.count) * 100)
                      : 0

                  return (
                    <React.Fragment key={item.stage}>
                      {idx > 0 && (
                        <div className="flex flex-col items-center -my-1.5 relative z-0">
                          <div className="w-px h-7 bg-gray-200" />
                          <div className="bg-white border border-gray-200 shadow-sm text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-1/2 -translate-y-1/2 z-10">
                            {convRate}%
                          </div>
                        </div>
                      )}
                      <div
                        className={cn(
                          'relative z-10 flex items-center justify-between px-4 py-2.5 rounded-xl shadow-sm text-white transition-transform hover:scale-[1.02]',
                          item.color,
                        )}
                        style={{ width: item.width }}
                      >
                        <span className="font-semibold text-sm drop-shadow-sm truncate pr-2">
                          {item.stage}
                        </span>
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          {!item.isLead && (
                            <span className="font-medium opacity-90 hidden sm:inline-block">
                              {formatCurrency(item.value)}
                            </span>
                          )}
                          <span className="bg-black/15 font-bold px-2 py-0.5 rounded-lg drop-shadow-sm min-w-[2rem] text-center">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
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

              <div className="mt-6 pt-4 border-t border-red-200/50 relative z-10">
                <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-green-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Win Rate
                    </span>
                  </div>
                  <span className="text-xl font-black text-green-600">
                    {lostDealsInfo.winRate}%
                  </span>
                </div>
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

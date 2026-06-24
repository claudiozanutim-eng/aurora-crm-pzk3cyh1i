import { useEffect, useState, useMemo } from 'react'
import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardLists } from '@/components/dashboard/DashboardLists'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { startOfMonth, endOfMonth, subMonths, startOfYear, parseISO } from 'date-fns'

export default function Index() {
  const [data, setData] = useState({
    clientes: [] as any[],
    leads: [] as any[],
    negocios: [] as any[],
    tarefas: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('current_month')

  const loadData = async () => {
    try {
      const [clientes, leads, negocios, tarefas] = await Promise.all([
        pb.collection('clientes').getFullList(),
        pb.collection('leads').getFullList(),
        pb.collection('negocios').getFullList({ expand: 'cliente_id' }),
        pb.collection('tarefas').getFullList({ expand: 'cliente_id,lead_id' }),
      ])
      setData({ clientes, leads, negocios, tarefas })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('clientes', loadData)
  useRealtime('leads', loadData)
  useRealtime('negocios', loadData)
  useRealtime('tarefas', loadData)

  const filteredData = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case 'current_month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'previous_month':
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
        break
      case 'ytd':
        startDate = startOfYear(now)
        break
      case 'all_time':
      default:
        startDate = new Date(2000, 0, 1)
        break
    }

    const isDateInPeriod = (dateStr?: string) => {
      if (!dateStr) return false
      const date = parseISO(dateStr.split(' ')[0])
      return date >= startDate && date <= endDate
    }

    // Apply period filters where appropriate
    const clientes = data.clientes.filter((c) => isDateInPeriod(c.data_cadastro || c.created))
    const leads = data.leads.filter((l) => isDateInPeriod(l.created))
    const negocios = data.negocios.filter((n) => isDateInPeriod(n.created))

    const leadsAtivos = leads.filter((l) => !['Não Qualificado', 'Convertido'].includes(l.status))
    const negociosAndamento = negocios.filter(
      (n) => !['Fechado/Ganho', 'Perdido'].includes(n.status),
    )

    const valorTotalPipeline = negociosAndamento.reduce(
      (acc, n) => acc + (n.valor_estimado || 0),
      0,
    )
    const valorPonderadoPipeline = negociosAndamento.reduce(
      (acc, n) => acc + ((n.valor_estimado || 0) * (n.probabilidade || 0)) / 100,
      0,
    )

    const resolvedInPeriod = data.negocios.filter(
      (n) =>
        ['Fechado/Ganho', 'Perdido'].includes(n.status) &&
        isDateInPeriod(n.data_fechamento_real || n.updated),
    )
    const wonInPeriod = resolvedInPeriod.filter((n) => n.status === 'Fechado/Ganho')

    const taxaConversao =
      resolvedInPeriod.length > 0 ? (wonInPeriod.length / resolvedInPeriod.length) * 100 : 0
    const ticketMedio =
      wonInPeriod.length > 0
        ? wonInPeriod.reduce((acc, n) => acc + (n.valor_estimado || 0), 0) / wonInPeriod.length
        : 0

    return {
      kpis: {
        totalClientes: clientes.length,
        leadsAtivos: leadsAtivos.length,
        negociosAndamento: negociosAndamento.length,
        valorTotalPipeline,
        valorPonderadoPipeline,
        taxaConversao,
        ticketMedio,
      },
      charts: {
        negocios, // pass filtered for funnel
        negociosAll: data.negocios, // pass all for evolution, chart groups internally
      },
      lists: {
        negocios: data.negocios,
        tarefas: data.tarefas,
      },
    }
  }, [data, period])

  return (
    <div className="space-y-6 h-full flex flex-col pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Comercial
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Acompanhe seus indicadores e funil de vendas em tempo real.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-subtle border-gray-200 text-gray-700">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="previous_month">Mês Anterior</SelectItem>
              <SelectItem value="ytd">Acumulado do Ano</SelectItem>
              <SelectItem value="all_time">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            asChild
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Link to="/funil">
              <Plus className="mr-2 h-4 w-4" /> Novo Negócio
            </Link>
          </Button>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <DashboardKpis data={filteredData.kpis} loading={loading} />
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <DashboardCharts data={filteredData.charts} period={period} loading={loading} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <DashboardLists data={filteredData.lists} loading={loading} />
      </div>
    </div>
  )
}

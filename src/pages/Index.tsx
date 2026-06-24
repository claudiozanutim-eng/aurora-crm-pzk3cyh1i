import { useEffect, useState, useMemo } from 'react'
import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardLists } from '@/components/dashboard/DashboardLists'
import { Button } from '@/components/ui/button'
import { Plus, CalendarIcon, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { getUsers, User } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  parseISO,
  format,
  parse,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function CustomDatePicker({
  date,
  setDate,
  placeholder,
  minDate,
  maxDate,
}: {
  date?: Date
  setDate: (d?: Date) => void
  placeholder: string
  minDate?: Date
  maxDate?: Date
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(date ? format(date, 'dd/MM/yyyy') : '')

  useEffect(() => {
    if (date) setInputValue(format(date, 'dd/MM/yyyy'))
    else setInputValue('')
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '')

    // simple auto slash insertion
    if (val.length === 2 && inputValue.length < val.length) val += '/'
    if (val.length === 5 && inputValue.length < val.length) val += '/'
    if (val.length > 10) val = val.substring(0, 10)

    setInputValue(val)
    if (val.length === 10) {
      const parsed = parse(val, 'dd/MM/yyyy', new Date())
      if (isValid(parsed)) {
        if (minDate && parsed < minDate) return
        if (maxDate && parsed > maxDate) return
        setDate(parsed)
      }
    } else if (val.length === 0) {
      setDate(undefined)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={10}
          className="w-[130px] pr-8 text-sm focus-visible:ring-orange-500 border-transparent shadow-none bg-gray-50 focus-visible:bg-white transition-colors"
        />
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-8 hover:bg-transparent text-gray-500 hover:text-orange-500"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              setDate(d)
              setInputValue(format(d, 'dd/MM/yyyy'))
              setIsOpen(false)
            }
          }}
          disabled={(d) => {
            if (minDate && d < minDate) return true
            if (maxDate && d > maxDate) return true
            return false
          }}
          locale={ptBR}
          classNames={{
            day_selected:
              'bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-500 focus:text-white',
            day_today: 'bg-orange-50 text-orange-600',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export default function Index() {
  const [data, setData] = useState({
    clientes: [] as any[],
    leads: [] as any[],
    negocios: [] as any[],
    tarefas: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('current_month')
  const [vendedorId, setVendedorId] = useState<string>('all')
  const [users, setUsers] = useState<User[]>([])
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error)
  }, [])

  const queryDates = useMemo(() => {
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
      case 'custom':
        startDate = customStartDate || new Date(2000, 0, 1)
        endDate = customEndDate || now
        if (customEndDate) {
          endDate = new Date(customEndDate)
          endDate.setHours(23, 59, 59, 999)
        }
        break
      case 'all_time':
      default:
        startDate = new Date(2000, 0, 1)
        break
    }
    return { startDate, endDate }
  }, [period, customStartDate, customEndDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = queryDates
      const startStr = startDate.toISOString().replace('T', ' ')
      const endStr = endDate.toISOString().replace('T', ' ')

      let filterClientes =
        period === 'all_time'
          ? ''
          : `((data_cadastro >= "${startStr}" && data_cadastro <= "${endStr}") || (created >= "${startStr}" && created <= "${endStr}"))`
      let filterLeads =
        period === 'all_time' ? '' : `(created >= "${startStr}" && created <= "${endStr}")`
      const chartYearStartStr = new Date(startDate.getFullYear() - 1, 0, 1)
        .toISOString()
        .replace('T', ' ')
      const chartYearEndStr = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        .toISOString()
        .replace('T', ' ')

      let filterNegocios =
        period === 'all_time'
          ? ''
          : `((created >= "${startStr}" && created <= "${endStr}") || (data_fechamento_real >= "${startStr}" && data_fechamento_real <= "${endStr}") || (updated >= "${startStr}" && updated <= "${endStr}") || (data_fechamento_real >= "${chartYearStartStr}" && data_fechamento_real <= "${chartYearEndStr}"))`
      let filterTarefas =
        period === 'all_time'
          ? ''
          : `((data_limite >= "${startStr}" && data_limite <= "${endStr}") || (created >= "${startStr}" && created <= "${endStr}"))`

      if (vendedorId !== 'all') {
        const vFilter = `vendedor_id = "${vendedorId}"`
        filterLeads = filterLeads ? `(${filterLeads}) && ${vFilter}` : vFilter
        filterNegocios = filterNegocios ? `(${filterNegocios}) && ${vFilter}` : vFilter
        filterTarefas = filterTarefas ? `(${filterTarefas}) && ${vFilter}` : vFilter
      }

      const [clientes, leads, negocios, tarefas] = await Promise.all([
        pb.collection('clientes').getFullList({ filter: filterClientes }),
        pb.collection('leads').getFullList({ filter: filterLeads }),
        pb
          .collection('negocios')
          .getFullList({ expand: 'cliente_id,vendedor_id', filter: filterNegocios }),
        pb
          .collection('tarefas')
          .getFullList({ expand: 'cliente_id,lead_id', filter: filterTarefas }),
      ])

      let finalClientes = clientes
      if (vendedorId !== 'all') {
        const clientIds = new Set(negocios.map((n) => n.cliente_id).filter(Boolean))
        finalClientes = clientes.filter((c) => clientIds.has(c.id))
      }

      setData({ clientes: finalClientes, leads, negocios, tarefas })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [queryDates, vendedorId])

  useRealtime('clientes', loadData)
  useRealtime('leads', loadData)
  useRealtime('negocios', loadData)
  useRealtime('tarefas', loadData)

  const filteredData = useMemo(() => {
    const { startDate, endDate } = queryDates

    const isDateInPeriod = (dateStr?: string) => {
      if (!dateStr) return false
      const date = parseISO(dateStr.split(' ')[0])
      return date >= startDate && date <= endDate
    }

    const clientes = data.clientes.filter((c) => isDateInPeriod(c.data_cadastro || c.created))
    const clientesAtivos = clientes.filter((c) => c.status === 'Ativo')

    const leads = data.leads.filter((l) => isDateInPeriod(l.created))
    const negocios = data.negocios.filter((n) => isDateInPeriod(n.created))

    const leadsAtivos = leads.filter((l) => !['Não Qualificado', 'Convertido'].includes(l.status))
    const negociosAndamento = negocios.filter(
      (n) => !['Fechado/Ganho', 'Perdido'].includes(n.status),
    )

    const valorTotalPipeline = negociosAndamento.reduce(
      (acc, n) => acc + (Number(n.valor_estimado) || 0),
      0,
    )
    const valorPonderadoPipeline = negociosAndamento.reduce(
      (acc, n) => acc + ((Number(n.valor_estimado) || 0) * (Number(n.probabilidade) || 0)) / 100,
      0,
    )

    const resolvedInPeriod = data.negocios.filter(
      (n) =>
        ['Fechado/Ganho', 'Perdido'].includes(n.status) &&
        isDateInPeriod(n.data_fechamento_real || n.updated),
    )
    const wonInPeriod = resolvedInPeriod.filter((n) => n.status === 'Fechado/Ganho')
    const lostInPeriod = resolvedInPeriod.filter((n) => n.status === 'Perdido')

    const valorTotalGanhos = wonInPeriod.reduce(
      (acc, n) => acc + (Number(n.valor_estimado) || 0),
      0,
    )
    const valorTotalPerdidos = lostInPeriod.reduce(
      (acc, n) => acc + (Number(n.valor_estimado) || 0),
      0,
    )

    const taxaConversao =
      resolvedInPeriod.length > 0 ? (wonInPeriod.length / resolvedInPeriod.length) * 100 : 0
    const ticketMedio = wonInPeriod.length > 0 ? valorTotalGanhos / wonInPeriod.length : 0

    return {
      kpis: {
        totalClientes: clientesAtivos.length,
        leadsAtivos: leadsAtivos.length,
        negociosAndamento: negociosAndamento.length,
        valorTotalPipeline,
        valorPonderadoPipeline,
        taxaConversao,
        ticketMedio,
        valorTotalGanhos,
        valorTotalPerdidos,
      },
      charts: {
        negocios, // pass filtered for funnel
        negociosAll: data.negocios, // pass all for evolution, chart groups internally
        leads, // pass filtered for funnel
        year: period === 'all_time' ? new Date().getFullYear() : startDate.getFullYear(),
      },
      lists: {
        negocios: negocios,
        tarefas: data.tarefas.filter((t) => isDateInPeriod(t.data_limite || t.created)),
      },
    }
  }, [data, queryDates])

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
        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {period !== 'custom' ? (
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-subtle border-gray-200 text-gray-700">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="previous_month">Mês Anterior</SelectItem>
                  <SelectItem value="ytd">Acumulado do Ano</SelectItem>
                  <SelectItem value="all_time">Todo o Período</SelectItem>
                  <SelectItem value="custom">Outro Período</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-1.5 bg-white rounded-md border border-gray-200 p-1 shadow-subtle animate-fade-in w-full sm:w-auto">
                <CustomDatePicker
                  date={customStartDate}
                  setDate={setCustomStartDate}
                  placeholder="Data Inicial"
                  maxDate={customEndDate}
                />
                <span className="text-gray-400 text-sm font-medium">até</span>
                <CustomDatePicker
                  date={customEndDate}
                  setDate={setCustomEndDate}
                  placeholder="Data Final"
                  minDate={customStartDate}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPeriod('current_month')}
                  className="text-gray-400 hover:text-red-500 h-9 w-9 flex-shrink-0"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Select value={vendedorId} onValueChange={setVendedorId}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-subtle border-gray-200 text-gray-700">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Vendedores</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
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

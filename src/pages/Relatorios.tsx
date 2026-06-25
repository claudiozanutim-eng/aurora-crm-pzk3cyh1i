import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Loader2 } from 'lucide-react'
import { getNegocios, type Negocio } from '@/services/negocios'
import { getUsers, type User } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const STATUSES = [
  'Prospecção',
  'Qualificação',
  'Proposta Enviada',
  'Negociação',
  'Fechado/Ganho',
  'Perdido',
]

export default function Relatorios() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])

  // Tab: Vendas state
  const [vendasStart, setVendasStart] = useState('')
  const [vendasEnd, setVendasEnd] = useState('')
  const [vendasVendedor, setVendasVendedor] = useState('todos')
  const [vendasStatus, setVendasStatus] = useState('todos')
  const [isExporting, setIsExporting] = useState(false)

  // Tab: Comparativo state
  const [p1Start, setP1Start] = useState('')
  const [p1End, setP1End] = useState('')
  const [p2Start, setP2Start] = useState('')
  const [p2End, setP2End] = useState('')

  const [appliedP1Start, setAppliedP1Start] = useState('')
  const [appliedP1End, setAppliedP1End] = useState('')
  const [appliedP2Start, setAppliedP2Start] = useState('')
  const [appliedP2End, setAppliedP2End] = useState('')

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getNegocios()
      setNegocios(data)
      const usersData = await getUsers()
      setVendedores(usersData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()

    // Default dates
    const now = new Date()
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const d1 = firstDayLastMonth.toISOString().split('T')[0]
    const d2 = lastDayLastMonth.toISOString().split('T')[0]
    const d3 = firstDayThisMonth.toISOString().split('T')[0]
    const d4 = now.toISOString().split('T')[0]

    setP1Start(d1)
    setP1End(d2)
    setP2Start(d3)
    setP2End(d4)
    setAppliedP1Start(d1)
    setAppliedP1End(d2)
    setAppliedP2Start(d3)
    setAppliedP2End(d4)
  }, [])

  useRealtime('negocios', () => loadData())

  const handleConfirmar = () => {
    setAppliedP1Start(p1Start)
    setAppliedP1End(p1End)
    setAppliedP2Start(p2Start)
    setAppliedP2End(p2End)
  }

  const handleExport = async (ids: string[], filename: string) => {
    setIsExporting(true)
    try {
      if (ids.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum dado para exportar.', variant: 'default' })
        return
      }
      const res = await pb.send('/backend/v1/spreadsheet/export', {
        method: 'POST',
        body: JSON.stringify({ source: 'negocios', ids, format: 'xlsx' }),
      })
      if (res.base64) {
        const byteCharacters = atob(res.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao exportar relatórios.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  // --- Data Processing: Vendas ---
  const getFilterDateStr = (n: Negocio) => {
    const d = n.data_fechamento_real || n.data_prevista_fechamento || n.created
    return d ? d.substring(0, 10) : ''
  }

  const vendasData = negocios.filter((n) => {
    if (vendasVendedor !== 'todos' && n.vendedor_id !== vendasVendedor) return false
    if (vendasStatus !== 'todos' && n.status !== vendasStatus) return false
    const dStr = getFilterDateStr(n)
    if (vendasStart && dStr < vendasStart) return false
    if (vendasEnd && dStr > vendasEnd) return false
    return true
  })

  // --- Data Processing: Comparativo ---
  const calcMetrics = (start: string, end: string) => {
    if (!start || !end)
      return { total: 0, valorTotal: 0, valorPonderado: 0, conversao: 0, ticketMedio: 0 }

    const deals = negocios.filter((n) => {
      const dStr = n.created ? n.created.substring(0, 10) : ''
      return dStr >= start && dStr <= end
    })

    const total = deals.length
    const valorTotal = deals.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0)
    const valorPonderado = deals.reduce(
      (acc, d) => acc + (Number(d.valor_estimado) || 0) * ((Number(d.probabilidade) || 0) / 100),
      0,
    )
    const ganhos = deals.filter((d) => d.status === 'Fechado/Ganho').length
    const conversao = total > 0 ? (ganhos / total) * 100 : 0
    const ticketMedio = total > 0 ? valorTotal / total : 0

    return { total, valorTotal, valorPonderado, conversao, ticketMedio }
  }

  const p1Metrics = calcMetrics(appliedP1Start, appliedP1End)
  const p2Metrics = calcMetrics(appliedP2Start, appliedP2End)

  const getVariance = (v1: number, v2: number) => {
    if (v1 === 0 && v2 === 0) return 0
    if (v1 === 0) return 100
    return ((v2 - v1) / Math.abs(v1)) * 100
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatPercent = (val: number) => val.toFixed(1) + '%'

  const renderVariance = (val: number) => {
    if (val === 0) return <span className="text-gray-500 font-medium">0%</span>
    if (val > 0) return <span className="text-emerald-600 font-medium">+{val.toFixed(1)}%</span>
    return <span className="text-red-600 font-medium">{val.toFixed(1)}%</span>
  }

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '-'
    const [y, m, d] = dStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="p-6 h-[calc(100vh-6rem)] flex flex-col overflow-hidden max-w-full">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Análise de vendas e performance do funil.</p>
      </div>

      <Tabs defaultValue="vendas" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full sm:w-auto self-start bg-gray-100/80 mb-4 p-1 rounded-lg">
          <TabsTrigger
            value="vendas"
            className="data-[state=active]:bg-[#FF8C00] data-[state=active]:text-white rounded-md px-4 py-2 transition-all"
          >
            Relatório de Vendas
          </TabsTrigger>
          <TabsTrigger
            value="comparativo"
            className="data-[state=active]:bg-[#FF8C00] data-[state=active]:text-white rounded-md px-4 py-2 transition-all"
          >
            Comparativo de Períodos
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="vendas"
          className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden m-0"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data Inicial</label>
                <Input
                  type="date"
                  value={vendasStart}
                  onChange={(e) => setVendasStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data Final</label>
                <Input
                  type="date"
                  value={vendasEnd}
                  onChange={(e) => setVendasEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Vendedor</label>
                <Select value={vendasVendedor} onValueChange={setVendasVendedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name || v.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                <Select value={vendasStatus} onValueChange={setVendasStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end sm:ml-4">
              <Button
                className="bg-[#FF8C00] hover:bg-[#E67E00] text-white w-full sm:w-auto"
                onClick={() =>
                  handleExport(
                    vendasData.map((n) => n.id),
                    'Relatorio_Vendas',
                  )
                }
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Probabilidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Vendedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendasData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendasData.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium text-gray-900">
                        {n.expand?.cliente_id?.nome || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={n.descricao}>
                        {n.descricao || '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(n.valor_estimado || 0)}</TableCell>
                      <TableCell>{n.probabilidade || 0}%</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {n.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDisplayDate(getFilterDateStr(n))}</TableCell>
                      <TableCell>{n.expand?.vendedor_id?.name || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent
          value="comparativo"
          className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden m-0"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Período 1</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Início</label>
                    <Input
                      type="date"
                      value={p1Start}
                      onChange={(e) => setP1Start(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Fim</label>
                    <Input type="date" value={p1End} onChange={(e) => setP1End(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Período 2</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Início</label>
                    <Input
                      type="date"
                      value={p2Start}
                      onChange={(e) => setP2Start(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Fim</label>
                    <Input type="date" value={p2End} onChange={(e) => setP2End(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-4">
              <Button
                className="bg-[#FF8C00] hover:bg-[#E67E00] text-white w-full"
                onClick={handleConfirmar}
              >
                Confirmar
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900 w-1/4">Métrica</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-1/4">
                    P1 ({formatDisplayDate(appliedP1Start)} - {formatDisplayDate(appliedP1End)})
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 w-1/4">
                    P2 ({formatDisplayDate(appliedP2Start)} - {formatDisplayDate(appliedP2End)})
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 w-1/4">Variação (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">Total de Negócios</TableCell>
                  <TableCell>{p1Metrics.total}</TableCell>
                  <TableCell>{p2Metrics.total}</TableCell>
                  <TableCell>
                    {renderVariance(getVariance(p1Metrics.total, p2Metrics.total))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">Valor Total</TableCell>
                  <TableCell>{formatCurrency(p1Metrics.valorTotal)}</TableCell>
                  <TableCell>{formatCurrency(p2Metrics.valorTotal)}</TableCell>
                  <TableCell>
                    {renderVariance(getVariance(p1Metrics.valorTotal, p2Metrics.valorTotal))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">Valor Ponderado</TableCell>
                  <TableCell>{formatCurrency(p1Metrics.valorPonderado)}</TableCell>
                  <TableCell>{formatCurrency(p2Metrics.valorPonderado)}</TableCell>
                  <TableCell>
                    {renderVariance(
                      getVariance(p1Metrics.valorPonderado, p2Metrics.valorPonderado),
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">Taxa de Conversão</TableCell>
                  <TableCell>{formatPercent(p1Metrics.conversao)}</TableCell>
                  <TableCell>{formatPercent(p2Metrics.conversao)}</TableCell>
                  <TableCell>
                    {renderVariance(getVariance(p1Metrics.conversao, p2Metrics.conversao))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">Ticket Médio</TableCell>
                  <TableCell>{formatCurrency(p1Metrics.ticketMedio)}</TableCell>
                  <TableCell>{formatCurrency(p2Metrics.ticketMedio)}</TableCell>
                  <TableCell>
                    {renderVariance(getVariance(p1Metrics.ticketMedio, p2Metrics.ticketMedio))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

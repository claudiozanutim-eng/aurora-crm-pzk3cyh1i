import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Plus, Filter, Download, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getNegocios, Negocio, updateNegocio, deleteNegocio } from '@/services/negocios'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { NegocioFormSheet } from '@/components/funil/NegocioFormSheet'
import { FechamentoModal } from '@/components/funil/FechamentoModal'
import { PerdaModal } from '@/components/funil/PerdaModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getUsers, User } from '@/services/users'
import useDashboardStore from '@/stores/use-dashboard-store'

export default function Funil() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])
  const [isNewDealOpen, setIsNewDealOpen] = useState(false)
  const [closingDeal, setClosingDeal] = useState<Negocio | null>(null)
  const [lostDeal, setLostDeal] = useState<Negocio | null>(null)

  const { vendedorId, periodo, setVendedorId, setPeriodo } = useDashboardStore()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportFunnel = async () => {
    setIsExporting(true)
    try {
      const ids = visibleNegocios.map((n) => n.id)
      if (ids.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum negócio visível para exportar.',
          variant: 'default',
        })
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
        a.download = `Funil_Vendas_${new Date().toISOString().split('T')[0]}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao exportar funil.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

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
  }, [])

  useRealtime('negocios', () => {
    loadData()
  })

  const getPeriodFilter = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()

    if (periodo === 'este_mes') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (periodo === 'mes_passado') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
    }
    if (periodo === 'este_ano') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  }

  const parseValor = (val: any) => {
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }

  const filteredNegocios = negocios.filter((n) => {
    if (vendedorId !== 'todos' && n.vendedor_id !== vendedorId) return false

    if (n.status === 'Fechado/Ganho' || n.status === 'Perdido') {
      if (periodo !== 'todos' && !getPeriodFilter(n.data_fechamento_real || n.updated)) {
        return false
      }
    }
    return true
  })

  const visibleNegocios = filteredNegocios.filter((n) => n.status !== 'Prospecção')

  let totalDeals = 0
  let totalPipeline = 0
  let totalGanhos = 0
  let totalPerdidos = 0

  const statusCounts = {
    Qualificação: 0,
    'Proposta Enviada': 0,
    Negociação: 0,
    'Fechado/Ganho': 0,
    Perdido: 0,
  } as Record<string, number>

  const isActiveStatus = (status: string) =>
    ['Qualificação', 'Proposta Enviada', 'Negociação'].includes(status)

  visibleNegocios.forEach((n) => {
    totalDeals++
    if (statusCounts[n.status] !== undefined) {
      statusCounts[n.status]++
    }

    const valor = parseValor(n.valor_estimado)

    if (isActiveStatus(n.status)) {
      totalPipeline += valor
    }

    if (n.status === 'Fechado/Ganho') {
      totalGanhos += valor
    }

    if (n.status === 'Perdido') {
      totalPerdidos += valor
    }
  })

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)

  const handleDeleteDeal = async (deal: Negocio) => {
    try {
      await deleteNegocio(deal.id)
      setNegocios((prev) => prev.filter((n) => n.id !== deal.id))
      toast({
        title: 'Negócio excluído',
        description: 'O negócio foi removido com sucesso.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o negócio.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (deal: Negocio, newStatus: Negocio['status']) => {
    if (deal.status === newStatus) return

    if (newStatus === 'Fechado/Ganho') {
      setClosingDeal(deal)
      return
    }

    if (newStatus === 'Perdido') {
      setLostDeal(deal)
      return
    }

    setNegocios((prev) => prev.map((n) => (n.id === deal.id ? { ...n, status: newStatus } : n)))

    try {
      await updateNegocio(deal.id, { status: newStatus })
    } catch (e) {
      loadData()
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Funil de Vendas
          </h1>
          <p className="text-gray-500 mt-1">Visão completa do pipeline de negócios.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px] border-0 focus:ring-0 shadow-none bg-transparent">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="este_mes">Este Mês</SelectItem>
                <SelectItem value="mes_passado">Mês Passado</SelectItem>
                <SelectItem value="este_ano">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <Select value={vendedorId} onValueChange={setVendedorId}>
              <SelectTrigger className="w-[160px] border-0 focus:ring-0 shadow-none bg-transparent">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Vendedores</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name || v.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="outline"
              className="text-[#FF8C00] border-[#FF8C00] hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] w-full sm:w-auto"
              onClick={handleExportFunnel}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar
            </Button>
            <Button
              className="bg-[#FF8C00] hover:bg-[#E67E00] text-white w-full sm:w-auto"
              onClick={() => setIsNewDealOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Negócio
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 px-1">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Total de Negócios</p>
            <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-medium border border-gray-200"
              >
                {status}: {count}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Valor Total do Pipeline</p>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {formatCurrency(totalPipeline)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Valor Total de Ganhos</p>
          <p className="text-2xl font-bold text-emerald-600 truncate">
            {formatCurrency(totalGanhos)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Valor Total de Perdidos</p>
          <p className="text-2xl font-bold text-red-600 truncate">
            {formatCurrency(totalPerdidos)}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <KanbanBoard
          negocios={visibleNegocios}
          onStatusChange={handleStatusChange}
          onDeleteDeal={handleDeleteDeal}
        />
      </div>

      <NegocioFormSheet open={isNewDealOpen} onOpenChange={setIsNewDealOpen} onSuccess={loadData} />

      {closingDeal && (
        <FechamentoModal
          deal={closingDeal}
          open={!!closingDeal}
          onOpenChange={(v: boolean) => !v && setClosingDeal(null)}
          onSuccess={loadData}
        />
      )}

      {lostDeal && (
        <PerdaModal
          deal={lostDeal}
          open={!!lostDeal}
          onOpenChange={(v: boolean) => !v && setLostDeal(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getNegocios, Negocio, updateNegocio } from '@/services/negocios'
import { useRealtime } from '@/hooks/use-realtime'
import { NegocioFormSheet } from '@/components/funil/NegocioFormSheet'
import { FechamentoModal } from '@/components/funil/FechamentoModal'
import { PerdaModal } from '@/components/funil/PerdaModal'

export default function Funil() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [isNewDealOpen, setIsNewDealOpen] = useState(false)
  const [closingDeal, setClosingDeal] = useState<Negocio | null>(null)
  const [lostDeal, setLostDeal] = useState<Negocio | null>(null)

  const loadData = async () => {
    try {
      const data = await getNegocios()
      setNegocios(data)
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

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let totalDeals = 0
  let totalPipeline = 0
  let totalGanhosMes = 0
  let totalPerdidosMes = 0

  const statusCounts = {
    Qualificação: 0,
    'Proposta Enviada': 0,
    Negociação: 0,
    'Fechado/Ganho': 0,
    Perdido: 0,
  } as Record<string, number>

  const isActiveStatus = (status: string) =>
    ['Qualificação', 'Proposta Enviada', 'Negociação'].includes(status)

  const visibleNegocios = negocios.filter((n) => n.status !== 'Prospecção')

  visibleNegocios.forEach((n) => {
    totalDeals++
    if (statusCounts[n.status] !== undefined) {
      statusCounts[n.status]++
    }

    if (isActiveStatus(n.status)) {
      totalPipeline += Number(n.valor_estimado) || 0
    }

    if (n.status === 'Fechado/Ganho' || n.status === 'Perdido') {
      const dateStr = n.data_fechamento_real || n.updated
      if (dateStr) {
        const d = new Date(dateStr)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          if (n.status === 'Fechado/Ganho') totalGanhosMes += Number(n.valor_estimado) || 0
          if (n.status === 'Perdido') totalPerdidosMes += Number(n.valor_estimado) || 0
        }
      }
    }
  })

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Funil de Vendas
          </h1>
          <p className="text-gray-500 mt-1">Visão completa do pipeline de negócios.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
            onClick={() => setIsNewDealOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Negócio
          </Button>
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
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalPipeline)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Valor Total de Ganhos (mês)</p>
          <p className="text-2xl font-bold text-emerald-600 truncate">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalGanhosMes)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Valor Total de Perdidos (mês)</p>
          <p className="text-2xl font-bold text-red-600 truncate">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalPerdidosMes)}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <KanbanBoard negocios={visibleNegocios} onStatusChange={handleStatusChange} />
      </div>

      <NegocioFormSheet open={isNewDealOpen} onOpenChange={setIsNewDealOpen} onSuccess={loadData} />

      {closingDeal && (
        <FechamentoModal
          deal={closingDeal}
          open={!!closingDeal}
          onOpenChange={(v) => !v && setClosingDeal(null)}
          onSuccess={loadData}
        />
      )}

      {lostDeal && (
        <PerdaModal
          deal={lostDeal}
          open={!!lostDeal}
          onOpenChange={(v) => !v && setLostDeal(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

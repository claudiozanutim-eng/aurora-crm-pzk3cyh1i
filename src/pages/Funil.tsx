import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getNegocios, Negocio, updateNegocio } from '@/services/negocios'
import { useRealtime } from '@/hooks/use-realtime'
import { NegocioFormSheet } from '@/components/funil/NegocioFormSheet'
import { FechamentoModal } from '@/components/funil/FechamentoModal'

export default function Funil() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [isNewDealOpen, setIsNewDealOpen] = useState(false)
  const [closingDeal, setClosingDeal] = useState<Negocio | null>(null)

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

  const totalDeals = negocios.length
  const totalPipeline = negocios.reduce((acc, n) => acc + (n.valor_estimado || 0), 0)
  const weightedPipeline = negocios.reduce(
    (acc, n) => acc + ((n.valor_estimado || 0) * (n.probabilidade || 0)) / 100,
    0,
  )

  const statusCounts = {
    Prospecção: 0,
    Qualificação: 0,
    'Proposta Enviada': 0,
    Negociação: 0,
    'Fechado/Ganho': 0,
    Perdido: 0,
  }
  negocios.forEach((n) => {
    if (statusCounts[n.status] !== undefined) statusCounts[n.status]++
  })

  const handleStatusChange = async (deal: Negocio, newStatus: Negocio['status']) => {
    if (deal.status === newStatus) return

    if (newStatus === 'Fechado/Ganho') {
      setClosingDeal(deal)
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total de Negócios</p>
          <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Valor Total do Pipeline</p>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              totalPipeline,
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Valor Ponderado</p>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              weightedPipeline,
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-2">Distribuição</p>
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
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <KanbanBoard negocios={negocios} onStatusChange={handleStatusChange} />
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
    </div>
  )
}

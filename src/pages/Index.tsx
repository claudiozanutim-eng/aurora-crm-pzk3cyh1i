import { useEffect, useState } from 'react'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getNegocios, Negocio, updateNegocio } from '@/services/negocios'
import { useRealtime } from '@/hooks/use-realtime'

export default function Index() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getNegocios()
      setNegocios(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('negocios', () => {
    loadData()
  })

  const handleStatusChange = async (deal: Negocio, newStatus: Negocio['status']) => {
    if (deal.status === newStatus) return
    setNegocios((prev) => prev.map((n) => (n.id === deal.id ? { ...n, status: newStatus } : n)))
    try {
      await updateNegocio(deal.id, { status: newStatus })
    } catch (e) {
      loadData()
    }
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Comercial
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe seus indicadores e funil de vendas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all hover:scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Novo Negócio
        </Button>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <KpiCards />
      </div>

      <div
        className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Funil de Vendas Atual
          </h2>
        </div>
        <div className="bg-white border rounded-xl shadow-subtle p-2 md:p-4 overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-gray-500 text-sm">
              Carregando funil de vendas...
            </div>
          ) : (
            <KanbanBoard negocios={negocios} onStatusChange={handleStatusChange} />
          )}
        </div>
      </div>
    </div>
  )
}

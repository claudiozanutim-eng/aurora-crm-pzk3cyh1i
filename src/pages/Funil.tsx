import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Filter, Plus } from 'lucide-react'

export default function Funil() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Funil de Vendas
          </h1>
          <p className="text-gray-500 mt-1">Visão completa do pipeline de negócios.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Negócio
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border rounded-xl shadow-subtle p-2 md:p-4 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}

import { Negocio } from '@/services/negocios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const COLUMNS = [
  'Prospecção',
  'Qualificação',
  'Proposta Enviada',
  'Negociação',
  'Fechado/Ganho',
  'Perdido',
] as const

type Status = (typeof COLUMNS)[number]

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'Alta')
    return <Badge className="bg-red-500 hover:bg-red-600 text-white border-transparent">Alta</Badge>
  if (priority === 'Média')
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent">
        Média
      </Badge>
    )
  return (
    <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent">Baixa</Badge>
  )
}

interface KanbanBoardProps {
  negocios?: Negocio[]
  onStatusChange?: (deal: Negocio, status: Status) => void
}

export function KanbanBoard({ negocios = [], onStatusChange }: KanbanBoardProps) {
  const [activeColumn, setActiveColumn] = useState<Status | null>(null)

  const safeNegocios = Array.isArray(negocios) ? negocios : []

  const handleDragStart = (e: React.DragEvent, deal: Negocio) => {
    e.dataTransfer.setData('dealId', deal.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, column: Status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeColumn !== column) setActiveColumn(column)
  }

  const handleDragLeave = () => {
    setActiveColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnStatus: Status) => {
    e.preventDefault()
    setActiveColumn(null)
    const dealId = e.dataTransfer.getData('dealId')
    const deal = safeNegocios.find((n) => n.id === dealId)
    if (deal && deal.status !== columnStatus && onStatusChange) {
      onStatusChange(deal, columnStatus)
    }
  }

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto p-4 hide-scrollbar snap-x">
      {COLUMNS.map((column) => {
        const columnDeals = safeNegocios.filter((n) => n.status === column)
        const isActive = activeColumn === column

        return (
          <div
            key={column}
            className={cn(
              'flex-shrink-0 w-80 flex flex-col rounded-xl border transition-colors snap-start',
              isActive ? 'border-orange-400 bg-orange-50/30' : 'bg-gray-50 border-gray-100',
            )}
            onDragOver={(e) => handleDragOver(e, column)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-100/50 bg-white/50 rounded-t-xl backdrop-blur-sm">
              <h3 className="font-semibold text-gray-700">{column}</h3>
              <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                {columnDeals.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {columnDeals.map((deal) => {
                const clientName = deal.expand?.cliente_id?.nome || 'Cliente Desconhecido'
                const contatos = deal.expand?.cliente_id?.expand?.contatos_via_cliente_id
                const mainContact =
                  contatos?.find((c) => c.is_principal)?.nome ||
                  contatos?.[0]?.nome ||
                  'Sem Contato'

                return (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className="cursor-grab active:cursor-grabbing hover:border-orange-300 transition-colors shadow-sm border-gray-200"
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <PriorityBadge priority={deal.prioridade} />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                        {clientName}
                      </h4>
                      <div className="space-y-1.5 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(deal.valor_estimado || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{mainContact}</span>
                        </div>
                        {deal.status === 'Fechado/Ganho' && deal.data_fechamento_real && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-green-700 font-medium block">
                              Data de Ganho: {deal.data_fechamento_real.substring(8, 10)}/
                              {deal.data_fechamento_real.substring(5, 7)}/
                              {deal.data_fechamento_real.substring(0, 4)}
                            </span>
                          </div>
                        )}
                        {deal.status === 'Perdido' && (
                          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                            {deal.data_fechamento_real && (
                              <span className="text-xs text-red-600 font-medium block">
                                Data de Perda: {deal.data_fechamento_real.substring(8, 10)}/
                                {deal.data_fechamento_real.substring(5, 7)}/
                                {deal.data_fechamento_real.substring(0, 4)}
                              </span>
                            )}
                            {deal.motivo_perda && (
                              <span className="text-xs text-red-600 font-medium block">
                                Motivo: {deal.motivo_perda}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {columnDeals.length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Solte aqui
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

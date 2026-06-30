import { useState } from 'react'
import { Trash2, GripVertical, Calendar, User } from 'lucide-react'
import type { Negocio } from '@/services/negocios'
import { cn } from '@/lib/utils'

const COLUMN_CONFIG = [
  { status: 'Prospect', label: 'Prospect', dot: 'bg-blue-500', header: 'bg-blue-50' },
  {
    status: 'Proposta Enviada',
    label: 'Proposta Enviada',
    dot: 'bg-indigo-500',
    header: 'bg-indigo-50',
  },
  { status: 'Negociação', label: 'Negociação', dot: 'bg-amber-500', header: 'bg-amber-50' },
  { status: 'Stand By', label: 'Stand By', dot: 'bg-gray-500', header: 'bg-gray-50' },
  {
    status: 'Fechado/Ganho',
    label: 'Fechado/Ganho',
    dot: 'bg-emerald-500',
    header: 'bg-emerald-50',
  },
  { status: 'Perdido', label: 'Perdido', dot: 'bg-red-500', header: 'bg-red-50' },
] as const

const PRIORITY_STYLES: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700 border-red-200',
  Média: 'bg-amber-100 text-amber-700 border-amber-200',
  Baixa: 'bg-green-100 text-green-700 border-green-200',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0)

interface KanbanBoardProps {
  negocios: Negocio[]
  onStatusChange: (deal: Negocio, newStatus: Negocio['status']) => void
  onDeleteDeal: (deal: Negocio) => void
}

export function KanbanBoard({ negocios, onStatusChange, onDeleteDeal }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId)
    setDraggedId(dealId)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    setDragOverStatus(status)
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    setDragOverStatus(null)
    const dealId = e.dataTransfer.getData('text/plain')
    const deal = negocios.find((n) => n.id === dealId)
    if (deal && deal.status !== status) {
      onStatusChange(deal, status as Negocio['status'])
    }
    setDraggedId(null)
  }

  return (
    <div className="flex h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-2 h-full p-3 min-w-min">
        {COLUMN_CONFIG.map((col) => {
          const colDeals = negocios.filter((n) => n.status === col.status)
          const colValue = colDeals.reduce((sum, n) => sum + (n.valor_estimado || 0), 0)

          return (
            <div
              key={col.status}
              className={cn(
                'flex flex-col w-[280px] shrink-0 rounded-lg border transition-colors',
                dragOverStatus === col.status
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50/50',
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-t-lg border-b border-gray-200',
                  col.header,
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', col.dot)} />
                  <span className="text-xs font-semibold text-gray-700 truncate">{col.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 shrink-0">{colDeals.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                {colDeals.map((deal) => {
                  const cliente = deal.expand?.cliente_id
                  const vendedor = deal.expand?.vendedor_id

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={() => {
                        setDraggedId(null)
                        setDragOverStatus(null)
                      }}
                      className={cn(
                        'group relative bg-white rounded-md border border-gray-200 p-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm hover:border-gray-300',
                        draggedId === deal.id && 'opacity-50',
                      )}
                    >
                      <button
                        onClick={() => onDeleteDeal(deal)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-start gap-1.5 pr-5">
                        <GripVertical className="h-3 w-3 text-gray-300 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                            {cliente?.nome || cliente?.nome_fantasia || 'Sem nome'}
                          </p>
                          <p className="text-sm font-semibold text-gray-700 mt-0.5">
                            {formatCurrency(deal.valor_estimado)}
                          </p>
                          {deal.prioridade && (
                            <span
                              className={cn(
                                'inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium mt-1',
                                PRIORITY_STYLES[deal.prioridade] || PRIORITY_STYLES.Baixa,
                              )}
                            >
                              {deal.prioridade}
                            </span>
                          )}
                          {(vendedor?.name || deal.data_prevista_fechamento) && (
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                              {vendedor?.name && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <User className="h-2.5 w-2.5 shrink-0" />
                                  {vendedor.name}
                                </span>
                              )}
                              {deal.data_prevista_fechamento && (
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                                  {new Date(deal.data_prevista_fechamento).toLocaleDateString(
                                    'pt-BR',
                                    { day: '2-digit', month: '2-digit' },
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {colDeals.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">Nenhum negócio</div>
                )}
              </div>

              {colValue > 0 && (
                <div className="px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-500 font-medium">
                  Total: {formatCurrency(colValue)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

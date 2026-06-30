import { Lead } from '@/services/leads'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Briefcase, CheckCircle2, Pencil, Trash2, GripVertical } from 'lucide-react'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { TagBadge } from '@/components/ui/tag-badge'

const COLUMN_CONFIG = [
  { status: 'Novos Leads', label: 'Novos Leads', dot: 'bg-blue-500', header: 'bg-blue-50' },
  {
    status: 'Primeiro Contato',
    label: 'Primeiro Contato',
    dot: 'bg-indigo-500',
    header: 'bg-indigo-50',
  },
  { status: 'Qualificando', label: 'Qualificando', dot: 'bg-amber-500', header: 'bg-amber-50' },
  { status: 'Não Qualificado', label: 'Não Qualificado', dot: 'bg-gray-500', header: 'bg-gray-50' },
  { status: 'Convertido', label: 'Convertido', dot: 'bg-emerald-500', header: 'bg-emerald-50' },
] as const

type Status = (typeof COLUMN_CONFIG)[number]['status']

const PRIORITY_STYLES: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700 border-red-200',
  Média: 'bg-amber-100 text-amber-700 border-amber-200',
  Baixa: 'bg-green-100 text-green-700 border-green-200',
}

interface LeadsKanbanBoardProps {
  leads?: Lead[]
  onStatusChange?: (lead: Lead, status: Status) => void
  onConvertLead?: (lead: Lead) => void
  onEditLead?: (lead: Lead) => void
  onDeleteLead?: (lead: Lead) => void
}

export function LeadsKanbanBoard({
  leads = [],
  onStatusChange,
  onConvertLead,
  onEditLead,
  onDeleteLead,
}: LeadsKanbanBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const wasDraggedRef = useRef(false)
  const navigate = useNavigate()

  const safeLeads = Array.isArray(leads) ? leads : []

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    wasDraggedRef.current = true
    e.dataTransfer.setData('text/plain', lead.id)
    setDraggedId(lead.id)
  }

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault()
    if (activeColumn !== column) setActiveColumn(column)
  }

  const handleDragLeave = () => {
    setActiveColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnStatus: Status) => {
    e.preventDefault()
    setActiveColumn(null)
    const leadId = e.dataTransfer.getData('text/plain')
    const lead = safeLeads.find((n) => n.id === leadId)
    if (lead && lead.status !== columnStatus && onStatusChange) {
      onStatusChange(lead, columnStatus)
    }
    setDraggedId(null)
  }

  return (
    <div className="flex h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-2 h-full p-3 min-w-min">
        {COLUMN_CONFIG.map((col) => {
          const columnLeads = safeLeads.filter((n) => n.status === col.status)

          return (
            <div
              key={col.status}
              className={cn(
                'flex flex-col w-[280px] shrink-0 rounded-lg border transition-colors',
                activeColumn === col.status
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50/50',
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div
                className={cn(
                  'flex flex-col px-3 py-2 rounded-t-lg border-b border-gray-200',
                  col.header,
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', col.dot)} />
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 shrink-0">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={() => {
                      setTimeout(() => {
                        wasDraggedRef.current = false
                      }, 0)
                      setDraggedId(null)
                      setActiveColumn(null)
                    }}
                    onClick={() => {
                      if (wasDraggedRef.current) return
                      navigate(`/leads/${lead.id}`, { state: { from: '/prospeccao' } })
                    }}
                    className={cn(
                      'group relative bg-white rounded-md border border-gray-200 p-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm hover:border-gray-300',
                      draggedId === lead.id && 'opacity-50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          'inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium',
                          PRIORITY_STYLES[lead.prioridade] || PRIORITY_STYLES.Baixa,
                        )}
                      >
                        {lead.prioridade}
                      </span>
                      {lead.origem && (
                        <span className="text-[10px] uppercase text-gray-500 font-medium">
                          {lead.origem}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5">
                      <GripVertical className="h-3 w-3 text-gray-300 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                          {lead.nome}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {lead.contato_nome && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{lead.contato_nome}</span>
                            </div>
                          )}
                          {lead.telefone && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Phone className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{lead.telefone}</span>
                            </div>
                          )}
                          {lead.segmento && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Briefcase className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{lead.segmento}</span>
                            </div>
                          )}
                        </div>

                        {lead.tags && lead.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {lead.tags.map((tag: string) => (
                              <TagBadge key={tag} tag={tag} />
                            ))}
                          </div>
                        )}

                        {col.status === 'Convertido' && (
                          <div className="mt-2">
                            {lead.cliente_id ? (
                              <div className="flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 py-1 px-2 rounded text-[10px] font-medium border border-emerald-100">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Convertido</span>
                              </div>
                            ) : (
                              <Button
                                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white h-7 text-[11px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onConvertLead?.(lead)
                                }}
                              >
                                Enviar para Vendas
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/90 p-0.5 rounded shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditLead?.(lead)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteLead?.(lead)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {columnLeads.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">Nenhum lead</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

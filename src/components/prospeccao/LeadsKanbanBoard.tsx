import { Lead } from '@/services/leads'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Briefcase, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { TagBadge } from '@/components/ui/tag-badge'

const COLUMNS = [
  'Novos Leads',
  'Primeiro Contato',
  'Qualificando',
  'Não Qualificado',
  'Convertido',
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

interface LeadsKanbanBoardProps {
  leads?: Lead[]
  onStatusChange?: (lead: Lead, status: Status) => void
  onConvertLead?: (lead: Lead) => void
  convertedClientNames?: Set<string>
}

export function LeadsKanbanBoard({
  leads = [],
  onStatusChange,
  onConvertLead,
  convertedClientNames = new Set(),
}: LeadsKanbanBoardProps) {
  const [activeColumn, setActiveColumn] = useState<Status | null>(null)
  const navigate = useNavigate()

  const safeLeads = Array.isArray(leads) ? leads : []

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead.id)
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
    const leadId = e.dataTransfer.getData('leadId')
    const lead = safeLeads.find((n) => n.id === leadId)
    if (lead && lead.status !== columnStatus && onStatusChange) {
      onStatusChange(lead, columnStatus)
    }
  }

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto p-4 hide-scrollbar snap-x">
      {COLUMNS.map((column) => {
        const columnLeads = safeLeads.filter((n) => n.status === column)
        const isActive = activeColumn === column

        return (
          <div
            key={column}
            className={cn(
              'flex-shrink-0 w-80 lg:w-auto lg:flex-1 lg:min-w-0 flex flex-col rounded-xl border transition-colors snap-start',
              isActive ? 'border-orange-400 bg-orange-50/30' : 'bg-gray-50 border-gray-100',
            )}
            onDragOver={(e) => handleDragOver(e, column)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-100/50 bg-white/50 rounded-t-xl backdrop-blur-sm">
              <h3 className="font-semibold text-gray-700">{column}</h3>
              <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                {columnLeads.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {columnLeads.map((lead) => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="cursor-pointer hover:border-orange-300 transition-colors shadow-sm border-gray-200"
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <PriorityBadge priority={lead.prioridade} />
                      <Badge variant="outline" className="text-[10px] uppercase text-gray-500">
                        {lead.origem}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{lead.nome}</h4>
                    <div className="space-y-1.5 text-sm text-gray-500">
                      {lead.contato_nome && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{lead.contato_nome}</span>
                        </div>
                      )}
                      {lead.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{lead.telefone}</span>
                        </div>
                      )}
                      {lead.segmento && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span>{lead.segmento}</span>
                        </div>
                      )}
                    </div>

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {lead.tags.map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    )}

                    {column === 'Convertido' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {convertedClientNames.has(lead.nome) ? (
                          <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-1.5 px-3 rounded-md text-sm font-medium border border-emerald-100">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Convertido para Venda</span>
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white h-8 text-sm"
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
                  </CardContent>
                </Card>
              ))}
              {columnLeads.length === 0 && (
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

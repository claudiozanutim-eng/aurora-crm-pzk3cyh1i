import { useState, useMemo } from 'react'
import { Lead } from '@/services/leads'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Briefcase, CheckCircle2, Pencil, Trash2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { TagBadge } from '@/components/ui/tag-badge'
import { Input } from '@/components/ui/input'

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
  onEditLead?: (lead: Lead) => void
  onDeleteLead?: (lead: Lead) => void
  convertedClientNames?: Set<string>
}

export function LeadsKanbanBoard({
  leads = [],
  onStatusChange,
  onConvertLead,
  onEditLead,
  onDeleteLead,
  convertedClientNames = new Set(),
}: LeadsKanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads
    const lower = searchTerm.toLowerCase()
    return leads.filter((l) => {
      const nome = l.nome?.toLowerCase() || ''
      const contatoNome = l.contato_nome?.toLowerCase() || ''
      return nome.includes(lower) || contatoNome.includes(lower)
    })
  }, [leads, searchTerm])

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.status !== status) {
      if (onStatusChange) onStatusChange(lead, status)
    }
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center space-x-2 bg-white p-2 rounded-md shadow-sm border border-gray-200 max-w-md">
        <Search className="h-5 w-5 text-orange-500" />
        <Input
          placeholder="Buscar empresa ou contato"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column}
            className="flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 rounded-lg p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
              {column}
              <Badge variant="secondary" className="bg-white text-black">
                {filteredLeads.filter((l) => l.status === column).length}
              </Badge>
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {filteredLeads
                .filter((l) => l.status === column)
                .map((lead) => {
                  const isConvertedClient = convertedClientNames.has(lead.nome)
                  return (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      className={cn(
                        'cursor-move transition-colors bg-white hover:border-orange-500',
                        lead.status === 'Convertido' ? 'border-green-200 bg-green-50/30' : '',
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div
                            className="font-medium text-sm text-black hover:text-orange-500 cursor-pointer"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            {lead.nome}
                          </div>
                          <div className="flex space-x-1">
                            {lead.status !== 'Convertido' && onConvertLead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-green-600 hover:bg-green-50"
                                onClick={() => onConvertLead(lead)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onEditLead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-600 hover:bg-blue-50"
                                onClick={() => onEditLead(lead)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {onDeleteLead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-600 hover:bg-red-50"
                                onClick={() => onDeleteLead(lead)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          {lead.contato_nome && (
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              {lead.contato_nome}
                            </div>
                          )}
                          {lead.telefone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {lead.telefone}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {lead.segmento}
                          </div>
                        </div>

                        {Array.isArray(lead.tags) && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {lead.tags.map((tag: any, idx: number) => (
                              <TagBadge key={idx} tag={tag} />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs border-t pt-2 mt-2">
                          <PriorityBadge priority={lead.prioridade} />
                          <div className="flex items-center text-gray-400">
                            {lead.expand?.vendedor_id?.name || 'Não atribuído'}
                          </div>
                        </div>
                        {isConvertedClient && lead.status !== 'Convertido' && (
                          <div className="mt-2 text-[10px] text-orange-600 bg-orange-50 p-1 rounded text-center font-medium">
                            Já existe cliente com este nome
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Negocio } from '@/services/negocios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, DollarSign, Trash2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRealtime } from '@/hooks/use-realtime'

const COLUMNS = [
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
  onDeleteDeal?: (deal: Negocio) => void
}

const parseValor = (val: any) => {
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)

export function KanbanBoard({ negocios = [], onStatusChange, onDeleteDeal }: KanbanBoardProps) {
  const [activeColumn, setActiveColumn] = useState<Status | null>(null)
  const [dealToDelete, setDealToDelete] = useState<Negocio | null>(null)
  const [approvedDeals, setApprovedDeals] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const safeNegocios = Array.isArray(negocios) ? negocios : []

  const fetchApprovedPropostas = async () => {
    try {
      const records = await pb.collection('propostas').getFullList({
        filter: 'arquivo_aprovado != ""',
        fields: 'negocio_id',
      })
      const dealIds = new Set(records.map((r) => r.negocio_id))
      setApprovedDeals(dealIds)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    fetchApprovedPropostas()
  }, [negocios])

  useRealtime('propostas', fetchApprovedPropostas)

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
    <>
      <div className="flex h-full w-full gap-4 overflow-x-auto p-4 hide-scrollbar snap-x">
        {COLUMNS.map((column) => {
          const columnDeals = safeNegocios.filter((n) => n.status === column)
          const isActive = activeColumn === column
          const columnTotal = columnDeals.reduce(
            (sum, deal) => sum + parseValor(deal.valor_estimado),
            0,
          )

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
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-700">{column}</h3>
                  <span className="text-xs font-medium text-gray-500 mt-0.5">
                    Total: {formatCurrency(columnTotal)}
                  </span>
                </div>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                  {columnDeals.length}
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {columnDeals.map((deal) => {
                  const clientName = deal.expand?.cliente_id?.nome || 'Cliente Desconhecido'
                  const contatos = deal.expand?.cliente_id?.expand?.contatos_via_cliente_id
                  const mainContact =
                    contatos?.find((c: any) => c.is_principal)?.nome ||
                    contatos?.[0]?.nome ||
                    'Sem Contato'
                  const dealValor = parseValor(deal.valor_estimado)

                  const isApproved = approvedDeals.has(deal.id)

                  return (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onClick={() =>
                        navigate(`/clientes/${deal.cliente_id}`, { state: { from: '/funil' } })
                      }
                      className={cn(
                        'cursor-pointer hover:border-orange-300 transition-colors shadow-sm',
                        isApproved ? 'border-green-400 ring-1 ring-green-100' : 'border-gray-200',
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <PriorityBadge priority={deal.prioridade} />
                          {isApproved && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>Proposta Aprovada (Arquivo Anexado)</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {clientName}
                        </h4>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center justify-center bg-emerald-100/50 text-emerald-700 p-1 rounded-md">
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-gray-900 text-base">
                              {formatCurrency(dealValor)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{mainContact}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-end min-h-[2rem]">
                            <div className="flex flex-col gap-1">
                              {deal.status === 'Fechado/Ganho' && deal.data_fechamento_real && (
                                <span className="text-xs text-green-700 font-medium block">
                                  Data de Ganho: {deal.data_fechamento_real.substring(8, 10)}/
                                  {deal.data_fechamento_real.substring(5, 7)}/
                                  {deal.data_fechamento_real.substring(0, 4)}
                                </span>
                              )}
                              {deal.status === 'Perdido' && (
                                <>
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
                                </>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDealToDelete(deal)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negócio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (dealToDelete && onDeleteDeal) {
                  onDeleteDeal(dealToDelete)
                }
                setDealToDelete(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

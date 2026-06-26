import { useState, useMemo } from 'react'
import { Negocio } from '@/services/negocios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, DollarSign, Trash2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Input } from '@/components/ui/input'

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
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val) || 0
  return 0
}

export function KanbanBoard({ negocios = [], onStatusChange, onDeleteDeal }: KanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDeal, setDeleteDeal] = useState<Negocio | null>(null)
  const navigate = useNavigate()

  const filteredNegocios = useMemo(() => {
    if (!searchTerm) return negocios
    const lower = searchTerm.toLowerCase()
    return negocios.filter((n) => {
      const clienteNome = n.expand?.cliente_id?.nome?.toLowerCase() || ''
      const clienteFantasia = n.expand?.cliente_id?.nome_fantasia?.toLowerCase() || ''
      const descricao = n.descricao?.toLowerCase() || ''
      return (
        clienteNome.includes(lower) || clienteFantasia.includes(lower) || descricao.includes(lower)
      )
    })
  }, [negocios, searchTerm])

  const handleDragStart = (e: React.DragEvent, deal: Negocio) => {
    e.dataTransfer.setData('dealId', deal.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('dealId')
    const deal = negocios.find((n) => n.id === dealId)
    if (deal && deal.status !== status) {
      if (onStatusChange) onStatusChange(deal, status)
    }
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center space-x-2 bg-white p-2 rounded-md shadow-sm border border-gray-200 max-w-md">
        <Search className="h-5 w-5 text-orange-500" />
        <Input
          placeholder="Buscar empresa ou negócio"
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
                {filteredNegocios.filter((n) => n.status === column).length}
              </Badge>
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {filteredNegocios
                .filter((n) => n.status === column)
                .map((deal) => (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className="cursor-move hover:border-orange-500 transition-colors bg-white"
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-black">
                          {deal.expand?.cliente_id?.nome_fantasia ||
                            deal.expand?.cliente_id?.nome ||
                            'Sem cliente'}
                        </div>
                        {onDeleteDeal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={() => setDeleteDeal(deal)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div
                        className="text-sm font-semibold mb-2 text-black hover:text-orange-500 cursor-pointer"
                        onClick={() => navigate(`/clientes/${deal.cliente_id}`)}
                      >
                        {deal.descricao || 'Sem descrição'}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(parseValor(deal.valor_estimado))}
                        </div>
                        <PriorityBadge priority={deal.prioridade} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {deal.expand?.vendedor_id?.name || 'Não atribuído'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteDeal} onOpenChange={() => setDeleteDeal(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Excluir negócio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o negócio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (deleteDeal && onDeleteDeal) onDeleteDeal(deleteDeal)
                setDeleteDeal(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

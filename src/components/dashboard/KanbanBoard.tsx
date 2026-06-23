import { kanbanBoardData, Deal } from '@/data/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, User, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

function PriorityBadge({ priority }: { priority: Deal['priority'] }) {
  if (priority === 'Alta') {
    return <Badge className="bg-orange-500 hover:bg-orange-600">Alta</Badge>
  }
  if (priority === 'Média') {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
        Média
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-gray-500 border-gray-200">
      Baixa
    </Badge>
  )
}

export function KanbanBoard() {
  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
      {kanbanBoardData.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 flex flex-col bg-gray-100/50 rounded-xl p-3 snap-start"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-gray-700">{column.title}</h3>
            <span className="bg-white text-gray-500 text-xs font-medium px-2 py-1 rounded-full shadow-sm border border-gray-100">
              {column.deals.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {column.deals.map((deal) => (
              <Card
                key={deal.id}
                className="cursor-grab hover:shadow-md hover:border-primary/30 transition-all duration-200 border-gray-200"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <PriorityBadge priority={deal.priority} />
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="sr-only">Opções</span>
                      •••
                    </button>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-3 line-clamp-1">{deal.company}</h4>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-900">
                        R$ {deal.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{deal.contact}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {column.deals.length === 0 && (
              <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Solte os cards aqui
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

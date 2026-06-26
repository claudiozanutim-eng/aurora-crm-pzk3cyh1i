import { Interacao } from '@/services/interacoes'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Mail,
  MessageCircle,
  Phone,
  Users,
  FileText,
  Send,
  ArrowRightLeft,
  Calendar,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractionsTimelineProps {
  interacoes: Interacao[]
}

const getIconForType = (tipo: string) => {
  switch (tipo) {
    case 'E-mail':
      return <Mail className="h-4 w-4" />
    case 'WhatsApp':
      return <MessageCircle className="h-4 w-4" />
    case 'Telefonema':
      return <Phone className="h-4 w-4" />
    case 'Reunião':
      return <Users className="h-4 w-4" />
    case 'Proposta Enviada':
      return <FileText className="h-4 w-4" />
    case 'Enviar Proposta':
      return <Send className="h-4 w-4" />
    case 'Movimentação de Funil':
      return <ArrowRightLeft className="h-4 w-4 text-white" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

const getColorForType = (tipo: string) => {
  switch (tipo) {
    case 'E-mail':
      return 'bg-blue-100 text-blue-600'
    case 'WhatsApp':
      return 'bg-green-100 text-green-600'
    case 'Telefonema':
      return 'bg-purple-100 text-purple-600'
    case 'Reunião':
      return 'bg-indigo-100 text-indigo-600'
    case 'Proposta Enviada':
      return 'bg-rose-100 text-rose-600'
    case 'Enviar Proposta':
      return 'bg-amber-100 text-amber-600'
    case 'Movimentação de Funil':
      return 'bg-orange-500 border border-orange-500'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function InteractionsTimeline({ interacoes = [] }: InteractionsTimelineProps) {
  if (!interacoes.length) {
    return <div className="text-center py-8 text-gray-500">Nenhuma interação registrada ainda.</div>
  }

  return (
    <div className="space-y-6">
      <div className="relative border-l border-gray-200 ml-3">
        {interacoes.map((interacao, idx) => {
          const isMovimentacao = interacao.tipo === 'Movimentação de Funil'
          return (
            <div key={interacao.id || idx} className="mb-6 ml-6 relative group">
              <span
                className={cn(
                  'absolute -left-10 flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white',
                  getColorForType(interacao.tipo),
                )}
              >
                {getIconForType(interacao.tipo)}
              </span>

              <div
                className={cn(
                  'rounded-lg border p-4 shadow-sm bg-white transition-shadow hover:shadow-md',
                  isMovimentacao ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100',
                )}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                  <h4
                    className={cn(
                      'text-sm font-semibold',
                      isMovimentacao ? 'text-orange-700' : 'text-gray-900',
                    )}
                  >
                    {interacao.tipo}
                  </h4>
                  <time className="text-xs text-gray-500 font-medium">
                    {format(new Date(interacao.data_hora), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </time>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {interacao.resumo}
                </p>

                {interacao.observacoes && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 italic">
                    {interacao.observacoes}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <User className="h-3 w-3" />
                  <span>{interacao.expand?.vendedor_id?.name || 'Sistema'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { parseISO, isPast, isToday, format, differenceInDays, differenceInYears } from 'date-fns'
import { AlertCircle, Clock, CheckCircle2, Target, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardListsProps {
  data: {
    negocios: any[]
    tarefas: any[]
    aniversariantes: any[]
  }
  loading: boolean
}

export function DashboardLists({ data, loading }: DashboardListsProps) {
  const dealsNearClosing = useMemo(() => {
    if (!data.negocios) return []
    return data.negocios
      .filter((n) => !['Fechado/Ganho', 'Perdido'].includes(n.status) && n.data_prevista_fechamento)
      .sort(
        (a, b) =>
          new Date(a.data_prevista_fechamento).getTime() -
          new Date(b.data_prevista_fechamento).getTime(),
      )
      .slice(0, 5)
  }, [data.negocios])

  const urgentTasks = useMemo(() => {
    if (!data.tarefas) return []
    return data.tarefas
      .filter((t) => ['Pendente', 'Em andamento'].includes(t.status) && t.data_limite)
      .filter((t) => {
        const limitDate = parseISO(t.data_limite)
        return isPast(limitDate) || isToday(limitDate)
      })
      .sort((a, b) => new Date(a.data_limite).getTime() - new Date(b.data_limite).getTime())
      .slice(0, 5)
  }, [data.tarefas])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getTaskStatusInfo = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return { label: 'Hoje', color: 'text-orange-600 bg-orange-100', icon: Clock }
    return { label: 'Atrasada', color: 'text-red-600 bg-red-100', icon: AlertCircle }
  }

  const birthdays = useMemo(() => {
    if (!data.aniversariantes) return []
    return data.aniversariantes.map((c) => {
      const bday = parseISO(c.data_aniversario)
      const age = differenceInYears(new Date(), bday)
      return { ...c, age }
    })
  }, [data.aniversariantes])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="shadow-subtle border-gray-100">
          <CardContent className="p-6 text-gray-400">Carregando negócios...</CardContent>
        </Card>
        <Card className="shadow-subtle border-gray-100">
          <CardContent className="p-6 text-gray-400">Carregando tarefas...</CardContent>
        </Card>
        <Card className="shadow-subtle border-gray-100">
          <CardContent className="p-6 text-gray-400">Carregando aniversariantes...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card className="shadow-subtle border-gray-100 bg-white">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-500" />
            Negócios Próximos do Fechamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dealsNearClosing.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Nenhum negócio com data prevista de fechamento próxima.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-gray-500">Cliente</TableHead>
                  <TableHead className="text-gray-500">Valor</TableHead>
                  <TableHead className="text-gray-500">Previsão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealsNearClosing.map((deal) => {
                  const daysLeft = differenceInDays(
                    parseISO(deal.data_prevista_fechamento),
                    new Date(),
                  )
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium text-gray-900">
                        {deal.expand?.cliente_id?.nome || 'Cliente Desconhecido'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {formatCurrency(deal.valor_estimado || 0)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {deal.probabilidade || 0}% prob.
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-gray-700">
                            {format(parseISO(deal.data_prevista_fechamento), 'dd/MM/yyyy')}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-medium',
                              daysLeft < 0
                                ? 'text-red-500'
                                : daysLeft <= 7
                                  ? 'text-orange-500'
                                  : 'text-green-600',
                            )}
                          >
                            {daysLeft < 0
                              ? 'Atrasado'
                              : daysLeft === 0
                                ? 'Hoje'
                                : `Em ${daysLeft} dias`}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100 bg-white">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Tarefas Atrasadas/Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {urgentTasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mb-2 opacity-50" />
              Nenhuma tarefa urgente pendente. Ótimo trabalho!
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-gray-500">Tarefa</TableHead>
                  <TableHead className="text-gray-500">Relacionado a</TableHead>
                  <TableHead className="text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urgentTasks.map((task) => {
                  const statusInfo = getTaskStatusInfo(task.data_limite)
                  const StatusIcon = statusInfo.icon
                  const relatedTo =
                    task.expand?.cliente_id?.nome || task.expand?.lead_id?.nome || 'N/A'
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex flex-col max-w-[200px]">
                          <span
                            className="font-medium text-gray-900 truncate"
                            title={task.descricao}
                          >
                            {task.descricao}
                          </span>
                          <span className="text-xs text-gray-500">{task.tipo || 'Outro'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{relatedTo}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'flex w-fit items-center gap-1 border-none',
                            statusInfo.color,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100 bg-white">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-black flex items-center">
            <Gift className="w-5 h-5 mr-2 text-orange-500" />
            Aniversariantes do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {birthdays.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nenhum aniversariante hoje</div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-gray-500">Contato</TableHead>
                  <TableHead className="text-gray-500 text-right">Idade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {birthdays.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-black">{b.nome}</span>
                        <span className="text-xs text-gray-500">
                          {b.expand?.cliente_id?.nome || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                      >
                        {b.age} anos
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

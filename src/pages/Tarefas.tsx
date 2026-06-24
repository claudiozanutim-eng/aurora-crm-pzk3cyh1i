import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfDay, endOfDay } from 'date-fns'
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { Tarefa, getAllTarefas, createTarefa, updateTarefa } from '@/services/tarefas'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function Tarefas() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [vendedorId, setVendedorId] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [prioridadeFilter, setPrioridadeFilter] = useState('all')
  const [clienteId, setClienteId] = useState('all')
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [t, u, c] = await Promise.all([
        getAllTarefas(),
        pb.collection('users').getFullList({ filter: 'ativo = true', sort: 'name' }),
        pb.collection('clientes').getFullList({ sort: 'nome' }),
      ])
      setTarefas(t)
      setUsers(u)
      setClientes(c)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('tarefas', loadData)

  const handleCreateTarefa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())

    try {
      await createTarefa({
        ...data,
        data_limite: new Date(data.data_limite as string).toISOString(),
      })
      setIsCreateOpen(false)
      toast({ title: 'Tarefa criada com sucesso!' })
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const previous = [...tarefas]
    setTarefas(tarefas.map((t) => (t.id === id ? { ...t, status: newStatus as any } : t)))
    try {
      await updateTarefa(id, { status: newStatus as any })
    } catch (error) {
      setTarefas(previous)
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const filteredTarefas = tarefas.filter((t) => {
    if (!mostrarConcluidas && t.status === 'Concluída') return false
    if (vendedorId !== 'all' && t.vendedor_id !== vendedorId) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (prioridadeFilter !== 'all' && t.prioridade !== prioridadeFilter) return false
    if (clienteId !== 'all' && t.cliente_id !== clienteId) return false

    if (search) {
      const term = search.toLowerCase()
      const descMatch = t.descricao.toLowerCase().includes(term)
      const clientMatch = t.expand?.cliente_id?.nome?.toLowerCase().includes(term)
      if (!descMatch && !clientMatch) return false
    }

    return true
  })

  const now = new Date()
  const todayStart = startOfDay(now).getTime()
  const todayEnd = endOfDay(now).getTime()

  const atrasadas = filteredTarefas.filter((t) => new Date(t.data_limite).getTime() < todayStart)
  const hoje = filteredTarefas.filter((t) => {
    const time = new Date(t.data_limite).getTime()
    return time >= todayStart && time <= todayEnd
  })
  const futuras = filteredTarefas.filter((t) => new Date(t.data_limite).getTime() > todayEnd)

  const renderTask = (t: Tarefa) => {
    const isCompleted = t.status === 'Concluída'
    const isOverdue = !isCompleted && new Date(t.data_limite).getTime() < now.getTime()

    return (
      <Card
        key={t.id}
        className={cn('transition-all hover:shadow-md border-l-4', {
          'opacity-60 bg-gray-50 border-l-gray-300': isCompleted,
          'border-l-red-500 bg-red-50/30': isOverdue,
          'border-l-blue-500': !isCompleted && !isOverdue,
        })}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <h3
              className={cn('font-semibold text-gray-900 text-sm leading-tight flex-1', {
                'line-through text-gray-500': isCompleted,
              })}
            >
              {t.descricao}
            </h3>
            <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
              <SelectTrigger className="h-7 text-xs w-[120px] px-2 flex-shrink-0 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {t.expand?.cliente_id && (
            <Link
              to={`/clientes/${t.cliente_id}`}
              className="text-xs text-[#FF6B00] hover:underline font-medium inline-flex items-center gap-1 w-fit"
            >
              <Users className="w-3 h-3" />
              {t.expand.cliente_id.nome}
            </Link>
          )}

          <div className="flex items-center justify-between text-xs mt-1">
            <div
              className={cn('flex items-center gap-1 font-medium', {
                'text-red-600': isOverdue,
                'text-gray-500': !isOverdue,
              })}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {format(new Date(t.data_limite), 'dd/MM/yyyy HH:mm')}
            </div>

            <Badge
              variant="secondary"
              className={cn('text-[10px] font-semibold border-transparent', {
                'bg-red-100 text-red-700 hover:bg-red-100': t.prioridade === 'Alta',
                'bg-yellow-100 text-yellow-700 hover:bg-yellow-100': t.prioridade === 'Média',
                'bg-green-100 text-green-700 hover:bg-green-100': t.prioridade === 'Baixa',
              })}
            >
              {t.prioridade}
            </Badge>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100 mt-1">
            <span>Resp: {t.expand?.vendedor_id?.name || 'N/A'}</span>
            {isOverdue && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3 h-3" /> Atrasada
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Tarefas</h1>
            <p className="text-gray-500 mt-1">Suas atividades e follow-ups agendados.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
                <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <form
                key={isCreateOpen ? 'open' : 'closed'}
                onSubmit={handleCreateTarefa}
                className="space-y-4 pt-4"
              >
                <div className="space-y-1">
                  <Label>Cliente</Label>
                  <Select name="cliente_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Textarea
                    name="descricao"
                    required
                    placeholder="Descreva a atividade..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Data Limite</Label>
                    <Input name="data_limite" type="datetime-local" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Responsável</Label>
                    <Select name="vendedor_id" required defaultValue={user?.id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Prioridade</Label>
                    <Select name="prioridade" defaultValue="Média" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo / Ação</Label>
                    <Select name="tipo" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E-mail">E-mail</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Telefonema">Telefonema</SelectItem>
                        <SelectItem value="Reunião">Reunião</SelectItem>
                        <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                        <SelectItem value="Enviar Proposta">Enviar Proposta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
                    Salvar Tarefa
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por descrição ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 w-full"
              />
            </div>
            <Select value={vendedorId} onValueChange={setVendedorId}>
              <SelectTrigger className="bg-gray-50 w-full lg:w-[180px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Vendedores</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-50 w-full lg:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger className="bg-gray-50 w-full lg:w-[160px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="bg-gray-50 w-full lg:w-[200px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
            <Switch
              checked={mostrarConcluidas}
              onCheckedChange={setMostrarConcluidas}
              id="mostrar-concluidas"
            />
            <Label
              htmlFor="mostrar-concluidas"
              className="text-sm cursor-pointer whitespace-nowrap text-gray-600 font-medium"
            >
              Mostrar tarefas concluídas
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Atrasadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-red-500">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Atrasadas
            </h2>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {atrasadas.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {atrasadas.map(renderTask)}
            {atrasadas.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                Nenhuma tarefa atrasada.
              </div>
            )}
          </div>
        </div>

        {/* Hoje */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#FF6B00]">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B00]" />
              Hoje
            </h2>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {hoje.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {hoje.map(renderTask)}
            {hoje.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                Nenhuma tarefa para hoje.
              </div>
            )}
          </div>
        </div>

        {/* Futuras */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              Futuras
            </h2>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {futuras.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {futuras.map(renderTask)}
            {futuras.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                Nenhuma tarefa futura.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

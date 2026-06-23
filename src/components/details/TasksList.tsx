import { useEffect, useState } from 'react'
import { getTarefas, createTarefa, updateTarefa, Tarefa } from '@/services/tarefas'
import { createInteracao } from '@/services/interacoes'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, AlertCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export function TasksList({
  targetId,
  targetType,
}: {
  targetId: string
  targetType: 'cliente' | 'lead'
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const load = async () => {
    try {
      setTarefas(await getTarefas(targetId, targetType))
      setUsers(await pb.collection('users').getFullList({ sort: 'name' }))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [targetId])
  useRealtime('tarefas', load)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())

    const dataLimiteStr = data.data_limite as string
    const finalDataLimite = dataLimiteStr
      ? new Date(dataLimiteStr).toISOString()
      : new Date().toISOString()

    try {
      await createTarefa({
        ...data,
        status: 'Pendente',
        data_limite: finalDataLimite,
        ...(targetType === 'cliente' ? { cliente_id: targetId } : { lead_id: targetId }),
      })
      toast({ title: 'Tarefa criada.' })
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState<Tarefa | null>(null)
  const [resumo, setResumo] = useState('')

  const changeStatus = async (id: string, status: Tarefa['status']) => {
    if (status === 'Concluída') {
      const task = tarefas.find((t) => t.id === id)
      if (task) {
        setCompletingTask(task)
        setCompleteDialogOpen(true)
      }
      return
    }
    try {
      await updateTarefa(id, { status })
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleCompletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completingTask) return
    try {
      await updateTarefa(completingTask.id, { status: 'Concluída' })
      await createInteracao({
        tipo: completingTask.tipo || 'Telefonema',
        data_hora: new Date().toISOString(),
        resumo,
        vendedor_id: completingTask.vendedor_id,
        ...(targetType === 'cliente' ? { cliente_id: targetId } : { lead_id: targetId }),
      })
      toast({ title: 'Tarefa concluída e interação registrada.' })
      setCompleteDialogOpen(false)
      setCompletingTask(null)
      setResumo('')
      load()
    } catch {
      toast({ title: 'Erro ao concluir tarefa', variant: 'destructive' })
    }
  }

  const isOverdue = (t: Tarefa) => {
    return new Date(t.data_limite).getTime() < Date.now() && t.status !== 'Concluída'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Tarefas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
              <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select name="tipo" required>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Interação" />
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
              <Input name="descricao" placeholder="Descrição" required />
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Data Limite (opcional)</span>
                <Input name="data_limite" type="datetime-local" title="Data Limite" />
              </div>
              <Select name="prioridade" defaultValue="Média">
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select name="vendedor_id" defaultValue={user?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full bg-[#FF6B00]">
                Salvar Tarefa
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {tarefas.map((t) => (
          <Card key={t.id} className={isOverdue(t) ? 'border-red-300 bg-red-50/10' : ''}>
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">{t.descricao}</h4>
                  {isOverdue(t) && (
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                      <AlertCircle className="w-3 h-3 mr-1" /> Atrasada
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />{' '}
                    {new Date(t.data_limite).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  <Badge
                    variant="secondary"
                    className={
                      t.prioridade === 'Alta'
                        ? 'bg-red-100 text-red-800'
                        : t.prioridade === 'Média'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }
                  >
                    {t.prioridade}
                  </Badge>
                  {t.tipo && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {t.tipo}
                    </Badge>
                  )}
                  <span>Resp: {t.expand?.vendedor_id?.name}</span>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <Select value={t.status} onValueChange={(v: any) => changeStatus(t.id, v)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {tarefas.length === 0 && (
          <p className="text-gray-500 text-sm italic">Nenhuma tarefa pendente.</p>
        )}
      </div>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompletion} className="space-y-4">
            <Textarea
              placeholder="Resumo da Interação..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              required
              rows={4}
            />
            <Button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#E66000]">
              Salvar e Registrar Interação
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

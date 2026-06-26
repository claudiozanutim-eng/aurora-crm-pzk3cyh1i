import { Bell, Check, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function Notifications() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [tarefas, setTarefas] = useState<any[]>([])
  const { toast } = useToast()

  const loadData = async () => {
    if (!user) return
    try {
      const res = await pb.collection('tarefas').getFullList({
        filter: `vendedor_id = "${user.id}" && status != 'Concluída'`,
        sort: 'data_limite',
      })
      setTarefas(res)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('tarefas', () => {
    loadData()
  })

  const handleConcluir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await pb.collection('tarefas').update(id, { status: 'Concluída' })
      toast({ title: 'Tarefa concluída!', variant: 'default' })
    } catch (err: any) {
      toast({ title: 'Erro ao concluir', description: err.message, variant: 'destructive' })
    }
  }

  const today = startOfDay(new Date())

  const paraHoje = tarefas.filter((t) => {
    const d = startOfDay(new Date(t.data_limite))
    return d.getTime() === today.getTime()
  })

  const atrasadas = tarefas.filter((t) => {
    const d = startOfDay(new Date(t.data_limite))
    return d.getTime() < today.getTime()
  })

  const hasNotifs = paraHoje.length > 0 || atrasadas.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'rounded-full relative text-gray-500 hover:bg-primary/10 transition-colors',
            hasNotifs && 'text-primary',
          )}
        >
          <Bell className="h-5 w-5" />
          {hasNotifs && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white animate-in zoom-in" />
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg rounded-xl border" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50 rounded-t-xl">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {paraHoje.length + atrasadas.length} pendentes
          </span>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {!hasNotifs ? (
            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
              <Bell className="h-8 w-8 text-gray-200 mb-3" />
              Nenhuma tarefa pendente para você.
            </div>
          ) : (
            <div className="flex flex-col pb-2">
              {atrasadas.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-2 text-xs font-semibold text-red-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Tarefas Atrasadas
                  </div>
                  {atrasadas.map((t) => (
                    <div
                      key={t.id}
                      className="group relative flex flex-col p-3 mx-2 my-1 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 pr-8">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {t.descricao}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Para:{' '}
                            {format(new Date(t.data_limite), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleConcluir(e, t.id)}
                          className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                          title="Concluir tarefa"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paraHoje.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-2 text-xs font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    Tarefas para Hoje
                  </div>
                  {paraHoje.map((t) => (
                    <div
                      key={t.id}
                      className="group relative flex flex-col p-3 mx-2 my-1 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 pr-8">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {t.descricao}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Hoje</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleConcluir(e, t.id)}
                          className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                          title="Concluir tarefa"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

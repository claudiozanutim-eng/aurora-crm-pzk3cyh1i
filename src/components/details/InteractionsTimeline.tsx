import { useEffect, useState } from 'react'
import { getInteracoes, createInteracao, Interacao } from '@/services/interacoes'
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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Mail, MessageCircle, Phone, Users, FileText, Send, Plus } from 'lucide-react'

const icons = {
  'E-mail': <Mail className="w-4 h-4 text-blue-500" />,
  WhatsApp: <MessageCircle className="w-4 h-4 text-green-500" />,
  Telefonema: <Phone className="w-4 h-4 text-purple-500" />,
  Reunião: <Users className="w-4 h-4 text-orange-500" />,
  'Proposta Enviada': <FileText className="w-4 h-4 text-red-500" />,
  'Enviar Proposta': <Send className="w-4 h-4 text-indigo-500" />,
}

export function InteractionsTimeline({
  targetId,
  targetType,
}: {
  targetId: string
  targetType: 'cliente' | 'lead'
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [open, setOpen] = useState(false)

  const [tipo, setTipo] = useState<Interacao['tipo']>('Telefonema')
  const [dataHora, setDataHora] = useState('')
  const [resumo, setResumo] = useState('')

  const load = async () => {
    try {
      const data = await getInteracoes(targetId, targetType)
      setInteracoes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [targetId])
  useRealtime('interacoes', load)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createInteracao({
        tipo,
        data_hora: new Date(dataHora).toISOString(),
        resumo,
        vendedor_id: user.id,
        ...(targetType === 'cliente' ? { cliente_id: targetId } : { lead_id: targetId }),
      })
      toast({ title: 'Interação registrada.' })
      setOpen(false)
      setResumo('')
      setDataHora('')
    } catch (err) {
      toast({ title: 'Erro ao registrar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Histórico de Interações</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
              <Plus className="w-4 h-4 mr-2" /> Nova Interação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Interação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(icons).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                required
              />
              <Textarea
                placeholder="Resumo da interação..."
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                required
                rows={4}
              />
              <Button type="submit" className="w-full bg-[#FF6B00]">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 mt-4">
        {interacoes.map((i) => (
          <div key={i.id} className="relative">
            <div className="absolute -left-[35px] bg-white p-2 rounded-full border-2 border-gray-100 shadow-sm flex items-center justify-center">
              {icons[i.tipo]}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-800">{i.tipo}</span>
                <span className="text-sm text-gray-500">
                  {new Date(i.data_hora).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{i.resumo}</p>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                Por: {i.expand?.vendedor_id?.name || 'Usuário Desconhecido'}
              </p>
            </div>
          </div>
        ))}
        {interacoes.length === 0 && (
          <p className="text-gray-500 text-sm italic">Nenhuma interação registrada.</p>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { createInteracao } from '@/services/interacoes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface MovementEvent {
  type: 'negocio' | 'lead'
  item: any
  from: string
  to: string
}

export function FunnelMovementModal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [eventData, setEventData] = useState<MovementEvent | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleMove = (e: any) => {
      setEventData(e.detail)
      setObservacoes('')
    }
    window.addEventListener('funnel-move', handleMove)
    return () => window.removeEventListener('funnel-move', handleMove)
  }, [])

  const handleSave = async (skip: boolean = false) => {
    if (!eventData || !user) return
    setLoading(true)
    try {
      const dataHora = new Date().toISOString()
      const resumo = `Card movido de ${eventData.from} para ${eventData.to} por ${user.name || 'Usuário'} em ${format(new Date(dataHora), 'dd/MM/yyyy HH:mm')}`

      const payload: any = {
        tipo: 'Movimentação de Funil',
        data_hora: dataHora,
        vendedor_id: user.id,
        resumo,
      }

      if (eventData.type === 'negocio') {
        payload.cliente_id = eventData.item.cliente_id
      } else {
        payload.lead_id = eventData.item.id
      }

      if (!skip && observacoes.trim()) {
        payload.observacoes = observacoes.trim()
      }

      await createInteracao(payload)
      if (!skip && observacoes.trim()) {
        toast({ title: 'Observação salva com sucesso!' })
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao registrar movimentação', variant: 'destructive' })
    } finally {
      setLoading(false)
      setEventData(null)
    }
  }

  return (
    <Dialog open={!!eventData} onOpenChange={(open) => !open && setEventData(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentação de Funil</DialogTitle>
          <DialogDescription>
            Card movido para <strong>{eventData?.to}</strong>. Deseja adicionar uma observação?
            (Opcional)
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Motivo da movimentação..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          disabled={loading}
        />
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleSave(true)} disabled={loading}>
            Pular
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
          >
            Salvar Observação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateNegocio, Negocio } from '@/services/negocios'
import { format, differenceInDays } from 'date-fns'

interface FechamentoModalProps {
  deal: Negocio
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FechamentoModal({ deal, open, onOpenChange, onSuccess }: FechamentoModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const dataFechamento = fd.get('data_fechamento') as string

    const realDate = new Date(dataFechamento)
    const createdDate = new Date(deal.created)
    const days = Math.max(0, differenceInDays(realDate, createdDate))

    try {
      await updateNegocio(deal.id, {
        status: 'Fechado/Ganho',
        data_fechamento_real:
          new Date(dataFechamento).toISOString().split('T')[0] + ' 12:00:00.000Z',
        ciclo_vendas_dias: days,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Negócio Ganho! 🎉</DialogTitle>
          <DialogDescription>
            Parabéns! Informe a data real de fechamento para calcular o ciclo de vendas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_fechamento">Data de Fechamento</Label>
            <Input
              type="date"
              name="data_fechamento"
              required
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Salvando...' : 'Confirmar Ganho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

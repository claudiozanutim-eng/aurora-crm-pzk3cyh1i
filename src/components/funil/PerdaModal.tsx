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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateNegocio, Negocio } from '@/services/negocios'
import { format, differenceInDays } from 'date-fns'

interface PerdaModalProps {
  deal: Negocio
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PerdaModal({ deal, open, onOpenChange, onSuccess }: PerdaModalProps) {
  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!motivo) return
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const dataPerda = fd.get('data_perda') as string

    const realDate = new Date(dataPerda)
    const createdDate = new Date(deal.created)
    const days = Math.max(0, differenceInDays(realDate, createdDate))

    try {
      await updateNegocio(deal.id, {
        status: 'Perdido',
        data_fechamento_real: new Date(dataPerda).toISOString().split('T')[0] + ' 12:00:00.000Z',
        ciclo_vendas_dias: days,
        motivo_perda: motivo as any,
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
          <DialogTitle>Detalhes da Perda</DialogTitle>
          <DialogDescription>
            Informe a data da perda e o motivo para finalizar o negócio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_perda">Data da perda</Label>
            <Input
              type="date"
              name="data_perda"
              required
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo_perda">Motivo da perda</Label>
            <Select name="motivo_perda" required onValueChange={setMotivo} value={motivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Desistiu do Projeto">Desistiu do Projeto</SelectItem>
                <SelectItem value="Preço">Preço</SelectItem>
                <SelectItem value="Preferiu Concorrente">Preferiu Concorrente</SelectItem>
                <SelectItem value="Cliente Sumiu">Cliente Sumiu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !motivo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

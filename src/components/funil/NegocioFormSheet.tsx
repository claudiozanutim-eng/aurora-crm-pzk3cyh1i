import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
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
import { Textarea } from '@/components/ui/textarea'
import { createNegocio } from '@/services/negocios'
import { getClientes, Cliente } from '@/services/clientes'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export function NegocioFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      getClientes().then(setClientes).catch(console.error)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)

    const prevDate = fd.get('data_prevista_fechamento') as string

    const data = {
      cliente_id: fd.get('cliente_id') as string,
      valor_estimado: Number(fd.get('valor_estimado') || 0),
      probabilidade: Number(fd.get('probabilidade') || 0),
      data_prevista_fechamento: prevDate ? `${prevDate} 12:00:00.000Z` : undefined,
      status: fd.get('status') as any,
      prioridade: fd.get('prioridade') as any,
      descricao: fd.get('descricao') as string,
    }

    try {
      await createNegocio(data)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Negócio</SheetTitle>
          <SheetDescription>Crie uma nova oportunidade de negócio.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente</Label>
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
            {errors.cliente_id && <p className="text-red-500 text-sm">{errors.cliente_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
              <Input type="number" step="0.01" min="0" name="valor_estimado" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probabilidade">Probabilidade (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                name="probabilidade"
                required
                defaultValue="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_prevista_fechamento">Data Prevista de Fechamento</Label>
            <Input type="date" name="data_prevista_fechamento" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estágio Inicial</Label>
              <Select name="status" defaultValue="Prospecção">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospecção">Prospecção</SelectItem>
                  <SelectItem value="Qualificação">Qualificação</SelectItem>
                  <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select name="prioridade" defaultValue="Média">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea name="descricao" rows={3} />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
            >
              {loading ? 'Salvando...' : 'Salvar Negócio'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createContato, updateContato } from '@/services/contatos'
import type { Contato, Cliente } from '@/services/clientes'

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

interface ContatoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: Contato | null
  clientes: Cliente[]
}

export function ContatoFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  clientes,
}: ContatoFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [isPrincipal, setIsPrincipal] = useState(false)
  const [telefone, setTelefone] = useState('')
  const [telefoneFixo, setTelefoneFixo] = useState('')

  useEffect(() => {
    if (open) {
      setClienteId(initialData?.cliente_id || '')
      setIsPrincipal(initialData?.is_principal || false)
      setTelefone(initialData?.telefone || '')
      setTelefoneFixo(initialData?.telefone_fixo || '')
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nome = (fd.get('nome') as string)?.trim()
    const selectedClientId = clienteId

    if (!nome) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!selectedClientId) {
      toast.error('Cliente é obrigatório')
      return
    }

    setIsLoading(true)
    try {
      const data = {
        nome,
        email: (fd.get('email') as string)?.trim() || '',
        telefone: telefone.trim(),
        telefone_fixo: telefoneFixo.trim(),
        cargo: (fd.get('cargo') as string)?.trim() || '',
        cliente_id: selectedClientId,
        is_principal: isPrincipal,
      }

      if (initialData) {
        await updateContato(initialData.id, data)
        toast.success('Contato atualizado com sucesso')
      } else {
        await createContato(data)
        toast.success('Contato criado com sucesso')
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(initialData ? 'Erro ao atualizar contato' : 'Erro ao criar contato')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input name="nome" defaultValue={initialData?.nome} required />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input name="email" type="email" defaultValue={initialData?.email} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone Celular</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone Fixo</Label>
              <Input
                value={telefoneFixo}
                onChange={(e) => setTelefoneFixo(maskPhone(e.target.value))}
                placeholder="(11) 3333-3333"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input name="cargo" defaultValue={initialData?.cargo} />
          </div>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId} required>
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_principal"
              checked={isPrincipal}
              onCheckedChange={(checked) => setIsPrincipal(checked === true)}
            />
            <Label htmlFor="is_principal" className="cursor-pointer">
              Contato Principal
            </Label>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#e55320] hover:bg-[#e55320]/90 text-white"
          >
            {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

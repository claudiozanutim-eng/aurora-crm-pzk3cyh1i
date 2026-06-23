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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [clienteId, setClienteId] = useState<string>('')
  const [openCombobox, setOpenCombobox] = useState(false)
  const [valorEstimado, setValorEstimado] = useState('')

  useEffect(() => {
    if (open) {
      getClientes().then(setClientes).catch(console.error)
      setClienteId('')
      setValorEstimado('')
    }
  }, [open])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    if (!numbers) {
      setValorEstimado('')
      return
    }
    const amount = Number(numbers) / 100
    setValorEstimado(
      amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    if (!clienteId) {
      setErrors({ cliente_id: 'Selecione um cliente.' })
      setLoading(false)
      return
    }

    const fd = new FormData(e.currentTarget)
    const prevDate = fd.get('data_prevista_fechamento') as string
    const rawValor = fd.get('valor_estimado') as string
    const valorNum = rawValor ? Number(rawValor.replace(/\./g, '').replace(',', '.')) : 0

    const data = {
      cliente_id: clienteId,
      valor_estimado: valorNum,
      probabilidade_nivel: fd.get('probabilidade_nivel') as any,
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
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="cliente_id">Cliente</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn(
                    'w-full justify-between font-normal',
                    !clienteId && 'text-muted-foreground',
                  )}
                >
                  {clienteId
                    ? clientes.find((c) => c.id === clienteId)?.nome
                    : 'Selecione um cliente'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientes.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nome}
                          onSelect={() => {
                            setClienteId(c.id)
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              clienteId === c.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {c.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.cliente_id && <p className="text-red-500 text-sm">{errors.cliente_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
              <Input
                type="text"
                name="valor_estimado"
                required
                value={valorEstimado}
                onChange={handleValorChange}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probabilidade_nivel">Probabilidade</Label>
              <Select name="probabilidade_nivel" defaultValue="Média">
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

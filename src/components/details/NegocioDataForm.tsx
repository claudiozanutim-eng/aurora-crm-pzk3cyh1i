import { useState, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Negocio, updateNegocio } from '@/services/negocios'
import { getAllUsers, User } from '@/services/users'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export interface NegocioDataFormRef {
  isDirty: boolean
  saveChanges: () => Promise<boolean>
}

export const NegocioDataForm = forwardRef<
  NegocioDataFormRef,
  { clienteId: string; onExit?: () => void }
>(({ clienteId, onExit }, ref) => {
  const { toast } = useToast()
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [selectedNegocioId, setSelectedNegocioId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [data, setData] = useState<Partial<Negocio>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedNegocios, fetchedUsers] = await Promise.all([
        pb.collection('negocios').getFullList<Negocio>({
          filter: `cliente_id="${clienteId}"`,
          sort: '-created',
        }),
        getAllUsers(),
      ])
      setNegocios(fetchedNegocios)
      setUsers(fetchedUsers)
      if (fetchedNegocios.length > 0) {
        setSelectedNegocioId(fetchedNegocios[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [clienteId])

  useRealtime('negocios', () => {
    loadData()
  })

  const selectedNegocio = negocios.find((n) => n.id === selectedNegocioId)
  const prevNegocioId = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedNegocio) return

    if (prevNegocioId.current !== selectedNegocio.id || !isDirty) {
      setData({
        descricao: selectedNegocio.descricao || '',
        vendedor_id: selectedNegocio.vendedor_id,
        valor_estimado: selectedNegocio.valor_estimado || 0,
        probabilidade: selectedNegocio.probabilidade || 0,
        probabilidade_nivel: selectedNegocio.probabilidade_nivel || undefined,
        data_prevista_fechamento: selectedNegocio.data_prevista_fechamento
          ? selectedNegocio.data_prevista_fechamento.split(' ')[0]
          : '',
        prioridade: selectedNegocio.prioridade,
        status: selectedNegocio.status,
      })
      setIsDirty(false)
      setFieldErrors({})
    }

    prevNegocioId.current = selectedNegocio.id
  }, [selectedNegocio, isDirty])

  useEffect(() => {
    if (!selectedNegocio) return
    const currentDataStr = JSON.stringify({
      descricao: data.descricao,
      vendedor_id: data.vendedor_id,
      valor_estimado: data.valor_estimado,
      probabilidade: data.probabilidade,
      probabilidade_nivel: data.probabilidade_nivel,
      data_prevista_fechamento: data.data_prevista_fechamento,
      prioridade: data.prioridade,
      status: data.status,
    })
    const initialDataStr = JSON.stringify({
      descricao: selectedNegocio.descricao || '',
      vendedor_id: selectedNegocio.vendedor_id,
      valor_estimado: selectedNegocio.valor_estimado || 0,
      probabilidade: selectedNegocio.probabilidade || 0,
      probabilidade_nivel: selectedNegocio.probabilidade_nivel || undefined,
      data_prevista_fechamento: selectedNegocio.data_prevista_fechamento
        ? selectedNegocio.data_prevista_fechamento.split(' ')[0]
        : '',
      prioridade: selectedNegocio.prioridade,
      status: selectedNegocio.status,
    })
    setIsDirty(currentDataStr !== initialDataStr)
  }, [data, selectedNegocio])

  const handleChange = (field: keyof Negocio, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const saveChanges = async () => {
    if (!selectedNegocioId) return false
    setFieldErrors({})
    try {
      const payload: Partial<Negocio> = { ...data }

      if (payload.data_prevista_fechamento) {
        payload.data_prevista_fechamento = `${payload.data_prevista_fechamento} 12:00:00.000Z`
      } else {
        payload.data_prevista_fechamento = '' as any
      }

      if (!payload.probabilidade_nivel) {
        payload.probabilidade_nivel = '' as any
      }

      await updateNegocio(selectedNegocioId, payload)
      toast({ title: 'Dados do negócio atualizados com sucesso.' })
      setIsDirty(false)
      await loadData()
      return true
    } catch (error) {
      const errors = extractFieldErrors(error)
      setFieldErrors(errors)
      const errorMsg = getErrorMessage(error)

      toast({
        title: 'Erro ao salvar as alterações',
        description: errorMsg || 'Por favor, verifique os campos e tente novamente.',
        variant: 'destructive',
      })
      return false
    }
  }

  useImperativeHandle(ref, () => ({
    isDirty,
    saveChanges,
  }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveChanges()
    if (success && onExit) {
      onExit()
    }
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    if (!numbers) {
      handleChange('valor_estimado', 0)
      return
    }
    const amount = Number(numbers) / 100
    handleChange('valor_estimado', amount)
  }

  const valorEstimadoFormatted = (data.valor_estimado || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (loading) return <div className="text-gray-500 py-4">Carregando negócios...</div>

  if (negocios.length === 0) {
    return <div className="text-gray-500 py-4">Nenhum negócio associado a este cliente.</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {negocios.length > 1 && (
        <div className="space-y-2 pb-4 border-b border-gray-100">
          <Label>Selecionar Negócio</Label>
          <Select value={selectedNegocioId!} onValueChange={setSelectedNegocioId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {negocios.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.descricao
                    ? `${n.descricao.slice(0, 30)}${n.descricao.length > 30 ? '...' : ''} `
                    : `Negócio `}
                  ({n.status}) - R$ {(n.valor_estimado || 0).toLocaleString('pt-BR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendedor Responsável</Label>
          <Select
            value={data.vendedor_id || undefined}
            onValueChange={(val) => handleChange('vendedor_id', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um vendedor" />
            </SelectTrigger>
            <SelectContent>
              {users
                .filter((u) => u.ativo !== false || u.id === data.vendedor_id)
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || 'Sem nome'}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {fieldErrors.vendedor_id && (
            <p className="text-sm text-red-500">{fieldErrors.vendedor_id}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Valor Estimado (R$)</Label>
          <Input value={valorEstimadoFormatted} onChange={handleValorChange} placeholder="0,00" />
          {fieldErrors.valor_estimado && (
            <p className="text-sm text-red-500">{fieldErrors.valor_estimado}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Probabilidade (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={data.probabilidade ?? ''}
            onChange={(e) => handleChange('probabilidade', Number(e.target.value))}
          />
          {fieldErrors.probabilidade && (
            <p className="text-sm text-red-500">{fieldErrors.probabilidade}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nível de Probabilidade</Label>
          <Select
            value={data.probabilidade_nivel || undefined}
            onValueChange={(val) => handleChange('probabilidade_nivel', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {['Alta', 'Média', 'Baixa'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.probabilidade_nivel && (
            <p className="text-sm text-red-500">{fieldErrors.probabilidade_nivel}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data Prevista de Fechamento</Label>
          <Input
            type="date"
            value={data.data_prevista_fechamento || ''}
            onChange={(e) => handleChange('data_prevista_fechamento', e.target.value)}
          />
          {fieldErrors.data_prevista_fechamento && (
            <p className="text-sm text-red-500">{fieldErrors.data_prevista_fechamento}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select
            value={data.prioridade || undefined}
            onValueChange={(val) => handleChange('prioridade', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {['Alta', 'Média', 'Baixa'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.prioridade && (
            <p className="text-sm text-red-500">{fieldErrors.prioridade}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={data.status || undefined}
            onValueChange={(val) => handleChange('status', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
              <SelectItem value="Negociação">Negociação</SelectItem>
              <SelectItem value="Stand By">Stand By</SelectItem>
              <SelectItem value="Fechado/Ganho">Fechado/Ganho</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.status && <p className="text-sm text-red-500">{fieldErrors.status}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          rows={4}
          value={data.descricao || ''}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Descrição do negócio..."
        />
        {fieldErrors.descricao && <p className="text-sm text-red-500">{fieldErrors.descricao}</p>}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-6">
        <div className="text-sm text-muted-foreground">
          {selectedNegocio?.updated &&
            (() => {
              const user = users.find((u) => u.id === selectedNegocio.vendedor_id)
              const userName = user?.name || 'Usuário'
              try {
                const dateObj = new Date(selectedNegocio.updated)
                const formattedDate = `${('0' + dateObj.getDate()).slice(-2)}/${('0' + (dateObj.getMonth() + 1)).slice(-2)}/${dateObj.getFullYear()}`
                const formattedTime = `${('0' + dateObj.getHours()).slice(-2)}:${('0' + dateObj.getMinutes()).slice(-2)}`
                return `Última atualização por ${userName} em ${formattedDate} às ${formattedTime}`
              } catch {
                return null
              }
            })()}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExit && onExit()}
            className="w-full sm:w-auto"
          >
            Sair sem Salvar
          </Button>
          <Button
            type="submit"
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white w-full sm:w-auto"
          >
            Salvar e Sair
          </Button>
        </div>
      </div>
    </form>
  )
})

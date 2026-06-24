import { useState, forwardRef, useEffect, useImperativeHandle } from 'react'
import { Negocio, updateNegocio } from '@/services/negocios'
import { getUsers, User } from '@/services/users'
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

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedNegocios, fetchedUsers] = await Promise.all([
        pb.collection('negocios').getFullList<Negocio>({
          filter: `cliente_id="${clienteId}"`,
          sort: '-created',
        }),
        getUsers(),
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

  const selectedNegocio = negocios.find((n) => n.id === selectedNegocioId)

  useEffect(() => {
    if (!selectedNegocio) return
    setData({
      descricao: selectedNegocio.descricao || '',
      vendedor_id: selectedNegocio.vendedor_id,
      valor_estimado: selectedNegocio.valor_estimado || 0,
      probabilidade: selectedNegocio.probabilidade || 0,
      data_prevista_fechamento: selectedNegocio.data_prevista_fechamento
        ? selectedNegocio.data_prevista_fechamento.split(' ')[0]
        : '',
      status: selectedNegocio.status,
      prioridade: selectedNegocio.prioridade,
      motivo_perda: selectedNegocio.motivo_perda || undefined,
    })
    setIsDirty(false)
  }, [selectedNegocio])

  useEffect(() => {
    if (!selectedNegocio) return
    const currentDataStr = JSON.stringify(data)
    const initialDataStr = JSON.stringify({
      descricao: selectedNegocio.descricao || '',
      vendedor_id: selectedNegocio.vendedor_id,
      valor_estimado: selectedNegocio.valor_estimado || 0,
      probabilidade: selectedNegocio.probabilidade || 0,
      data_prevista_fechamento: selectedNegocio.data_prevista_fechamento
        ? selectedNegocio.data_prevista_fechamento.split(' ')[0]
        : '',
      status: selectedNegocio.status,
      prioridade: selectedNegocio.prioridade,
      motivo_perda: selectedNegocio.motivo_perda || undefined,
    })
    setIsDirty(currentDataStr !== initialDataStr)
  }, [data, selectedNegocio])

  const handleChange = (field: keyof Negocio, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const saveChanges = async () => {
    if (!selectedNegocioId) return false
    try {
      const payload: Partial<Negocio> = { ...data }
      if (payload.data_prevista_fechamento) {
        payload.data_prevista_fechamento = `${payload.data_prevista_fechamento} 12:00:00.000Z`
      }
      if (payload.status !== 'Perdido') {
        payload.motivo_perda = '' as any
      }
      await updateNegocio(selectedNegocioId, payload)
      toast({ title: 'Dados do negócio atualizados com sucesso.' })
      setIsDirty(false)
      await loadData()
      return true
    } catch (error) {
      toast({
        title: 'Erro ao salvar as alterações',
        description: 'Por favor, tente novamente.',
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
            value={data.vendedor_id}
            onValueChange={(val) => handleChange('vendedor_id', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um vendedor" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || 'Sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Valor Estimado (R$)</Label>
          <Input value={valorEstimadoFormatted} onChange={handleValorChange} placeholder="0,00" />
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
        </div>

        <div className="space-y-2">
          <Label>Data Prevista de Fechamento</Label>
          <Input
            type="date"
            value={data.data_prevista_fechamento || ''}
            onChange={(e) => handleChange('data_prevista_fechamento', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={data.status} onValueChange={(val) => handleChange('status', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'Prospecção',
                'Qualificação',
                'Proposta Enviada',
                'Negociação',
                'Fechado/Ganho',
                'Perdido',
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={data.prioridade} onValueChange={(val) => handleChange('prioridade', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Alta', 'Média', 'Baixa'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.status === 'Perdido' && (
          <div className="space-y-2">
            <Label>Motivo da Perda</Label>
            <Select
              value={data.motivo_perda || ''}
              onValueChange={(val) => handleChange('motivo_perda', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {['Desistiu do Projeto', 'Preço', 'Preferiu Concorrente', 'Cliente Sumiu'].map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          rows={4}
          value={data.descricao || ''}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Descrição do negócio..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => onExit && onExit()}>
          Sair sem Salvar
        </Button>
        <Button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
          Salvar e Sair
        </Button>
      </div>
    </form>
  )
})

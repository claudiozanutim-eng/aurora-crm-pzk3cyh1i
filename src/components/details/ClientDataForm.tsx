import { useState, forwardRef, useEffect, useImperativeHandle } from 'react'
import { Cliente, updateCliente } from '@/services/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AddressFields } from '@/components/clientes/AddressFields'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export interface ClientDataFormRef {
  isDirty: boolean
  saveChanges: () => Promise<boolean>
}

export const ClientDataForm = forwardRef<
  ClientDataFormRef,
  { cliente: Cliente; onExit?: () => void }
>(({ cliente, onExit }, ref) => {
  const { toast } = useToast()
  const [data, setData] = useState<Partial<Cliente>>({
    tipo: cliente.tipo,
    documento: cliente.documento || '',
    nome: cliente.nome || '',
    nome_fantasia: cliente.nome_fantasia || '',
    segmento: cliente.segmento,
    porte: cliente.porte,
    status: cliente.status,
    observacoes: cliente.observacoes || '',
    tags: cliente.tags || [],
    pais: cliente.pais || 'Brasil',
    cep: cliente.cep || '',
    rua: cliente.rua || '',
    numero: cliente.numero || '',
    complemento: cliente.complemento || '',
    bairro: cliente.bairro || '',
    cidade: cliente.cidade || '',
    estado: cliente.estado || '',
  })

  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) {
      setData({
        tipo: cliente.tipo,
        documento: cliente.documento || '',
        nome: cliente.nome || '',
        nome_fantasia: cliente.nome_fantasia || '',
        segmento: cliente.segmento,
        porte: cliente.porte,
        status: cliente.status,
        observacoes: cliente.observacoes || '',
        tags: cliente.tags || [],
        pais: cliente.pais || 'Brasil',
        cep: cliente.cep || '',
        rua: cliente.rua || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
      })
    }
  }, [cliente, isDirty])

  useEffect(() => {
    const dirty =
      data.tipo !== cliente.tipo ||
      data.documento !== (cliente.documento || '') ||
      data.nome !== (cliente.nome || '') ||
      data.nome_fantasia !== (cliente.nome_fantasia || '') ||
      data.segmento !== cliente.segmento ||
      data.porte !== cliente.porte ||
      data.status !== cliente.status ||
      data.observacoes !== (cliente.observacoes || '') ||
      JSON.stringify(data.tags || []) !== JSON.stringify(cliente.tags || []) ||
      data.pais !== (cliente.pais || 'Brasil') ||
      data.cep !== (cliente.cep || '') ||
      data.rua !== (cliente.rua || '') ||
      data.numero !== (cliente.numero || '') ||
      data.complemento !== (cliente.complemento || '') ||
      data.bairro !== (cliente.bairro || '') ||
      data.cidade !== (cliente.cidade || '') ||
      data.estado !== (cliente.estado || '')
    setIsDirty(dirty)
  }, [data, cliente])

  const handleChange = (field: keyof Cliente, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const saveChanges = async () => {
    try {
      await updateCliente(cliente.id, data)
      toast({ title: 'Dados do cliente atualizados com sucesso.' })
      setIsDirty(false)
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

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={data.tipo} onValueChange={(val) => handleChange('tipo', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              <SelectItem value="PF">Pessoa Física</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{data.tipo === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
          <Input
            value={data.documento}
            onChange={(e) => handleChange('documento', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{data.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'}</Label>
          <Input
            value={data.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            required
          />
        </div>
        {data.tipo === 'PJ' && (
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input
              value={data.nome_fantasia}
              onChange={(e) => handleChange('nome_fantasia', e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Segmento</Label>
          <Select value={data.segmento} onValueChange={(val) => handleChange('segmento', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'Educação',
                'Tecnologia',
                'Varejo',
                'Agro',
                'Indústria',
                'Serviços',
                'Cooperativa',
                'Outro',
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Porte</Label>
          <Select value={data.porte} onValueChange={(val) => handleChange('porte', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Micro', 'Pequeno', 'Médio', 'Grande'].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={data.status} onValueChange={(val) => handleChange('status', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Ativo', 'Inativo', 'Prospect'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tag</Label>
        <Select
          value={data.tags?.[0] || 'nenhuma'}
          onValueChange={(val) => handleChange('tags', val === 'nenhuma' ? [] : [val])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Sem tag</SelectItem>
            <SelectItem value="Frio">Frio</SelectItem>
            <SelectItem value="Quente">Quente</SelectItem>
            <SelectItem value="Parceria">Parceria</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={data.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
        />
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
        <AddressFields
          values={{
            pais: data.pais || 'Brasil',
            cep: data.cep || '',
            rua: data.rua || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
          }}
          onChange={(field, value) => handleChange(field as keyof Cliente, value)}
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

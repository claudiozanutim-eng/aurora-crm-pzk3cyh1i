import { useState } from 'react'
import { Cliente, updateCliente } from '@/services/clientes'
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

export function ClientDataForm({ cliente }: { cliente: Cliente }) {
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
  })

  const handleChange = (field: keyof Cliente, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCliente(cliente.id, data)
      toast({ title: 'Dados do cliente atualizados com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
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
              {['Ativo', 'Inativo', 'Lead'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={data.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
        />
      </div>
      <Button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
        Salvar Dados
      </Button>
    </form>
  )
}

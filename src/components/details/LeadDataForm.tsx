import { useState } from 'react'
import { Lead, updateLead } from '@/services/leads'
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

export function LeadDataForm({ lead }: { lead: Lead }) {
  const { toast } = useToast()
  const [data, setData] = useState<Partial<Lead>>({
    nome: lead.nome || '',
    tipo: lead.tipo,
    segmento: lead.segmento,
    status: lead.status,
    prioridade: lead.prioridade,
    origem: lead.origem,
    observacoes: lead.observacoes || '',
  })

  const handleChange = (field: keyof Lead, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateLead(lead.id, data)
      toast({ title: 'Dados do lead atualizados com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome / Empresa</Label>
          <Input
            value={data.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            required
          />
        </div>
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
          <Label>Status</Label>
          <Select value={data.status} onValueChange={(val) => handleChange('status', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'Novos Leads',
                'Primeiro Contato',
                'Qualificando',
                'Não Qualificado',
                'Convertido',
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
              {['Alta', 'Média', 'Baixa'].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origem</Label>
          <Select value={data.origem} onValueChange={(val) => handleChange('origem', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Indicação', 'Site', 'Redes Sociais', 'Evento', 'Outro'].map((s) => (
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

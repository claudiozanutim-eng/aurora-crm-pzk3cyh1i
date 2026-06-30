import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPropostaById, createProposta, updateProposta } from '@/services/propostas'
import { getClientes, type Cliente } from '@/services/clientes'
import { getNegocios, type Negocio } from '@/services/negocios'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function PropostaForm() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    cliente_id: '',
    negocio_id: '',
    valor_total: '',
    validade_ate: undefined as Date | undefined,
    descricao_servicos: '',
    condicoes_comerciais: '',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const [cData, nData] = await Promise.all([getClientes(), getNegocios()])
        setClientes(cData)
        setNegocios(nData)

        if (id) {
          const p = await getPropostaById(id)
          setFormData({
            titulo: p.titulo,
            cliente_id: p.cliente_id,
            negocio_id: p.negocio_id || '',
            valor_total: p.valor_total.toString(),
            validade_ate: p.validade_ate ? new Date(p.validade_ate) : undefined,
            descricao_servicos: p.descricao_servicos,
            condicoes_comerciais: p.condicoes_comerciais,
          })
        }
      } catch (err) {
        toast.error('Erro ao carregar dados.')
      }
    }
    init()
  }, [id])

  const negociosFiltrados = negocios.filter((n) => n.cliente_id === formData.cliente_id)

  const handleSave = async () => {
    if (
      !formData.titulo ||
      !formData.cliente_id ||
      !formData.valor_total ||
      !formData.descricao_servicos ||
      !formData.condicoes_comerciais ||
      !formData.validade_ate
    ) {
      toast.error('Preencha todos os campos obrigatórios em todas as etapas.')
      return
    }

    setLoading(true)
    try {
      const now = new Date()
      const diffMs = formData.validade_ate.getTime() - now.getTime()
      const validade_dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

      const payload = {
        titulo: formData.titulo,
        cliente_id: formData.cliente_id,
        negocio_id: formData.negocio_id || undefined,
        valor_total: parseFloat(formData.valor_total),
        validade_dias,
        validade_ate: formData.validade_ate.toISOString(),
        descricao_servicos: formData.descricao_servicos,
        condicoes_comerciais: formData.condicoes_comerciais,
      }

      if (id) {
        await updateProposta(id, payload)
        toast.success('Proposta atualizada com sucesso!')
      } else {
        await createProposta({ ...payload, status: 'Rascunho' })
        toast.success('Proposta criada com sucesso!')
      }
      navigate('/propostas')
    } catch (err) {
      toast.error('Erro ao salvar proposta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar Proposta' : 'Nova Proposta'}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-white text-gray-700"
            onClick={() => navigate('/propostas')}
          >
            Sair sem Salvar
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar e Sair'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center flex-1">
            <div
              className={`w-full h-2 rounded-full mx-1 ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`}
            />
            <span
              className={`text-xs mt-2 font-medium ${s <= step ? 'text-orange-600' : 'text-gray-400'}`}
            >
              {s === 1 ? 'Dados Básicos' : s === 2 ? 'Descrição' : 'Condições'}
            </span>
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 md:p-8 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Dados Básicos</h2>
              <div className="space-y-2">
                <Label>
                  Título da Proposta <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Consultoria em TI"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(v) =>
                      setFormData({ ...formData, cliente_id: v, negocio_id: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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
                <div className="space-y-2">
                  <Label>Negócio (Opcional)</Label>
                  <Select
                    value={formData.negocio_id}
                    onValueChange={(v) => setFormData({ ...formData, negocio_id: v })}
                    disabled={!formData.cliente_id || negociosFiltrados.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          negociosFiltrados.length ? 'Selecione o negócio...' : 'Nenhum negócio'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {negociosFiltrados.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.descricao || `Negócio de ${n.valor_estimado}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Valor Total (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Validade <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.validade_ate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.validade_ate ? (
                          format(formData.validade_ate, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.validade_ate}
                        onSelect={(date) => setFormData({ ...formData, validade_ate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Descrição dos Serviços</h2>
              <p className="text-sm text-gray-500 mb-4">
                Detalhe todo o escopo do serviço ou produto que será entregue.
              </p>
              <div className="flex-1 space-y-2">
                <Textarea
                  className="min-h-[300px] resize-y"
                  value={formData.descricao_servicos}
                  onChange={(e) => setFormData({ ...formData, descricao_servicos: e.target.value })}
                  placeholder="Escopo do projeto, fases, entregáveis..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Condições Comerciais</h2>
              <p className="text-sm text-gray-500 mb-4">
                Especifique formas de pagamento, prazos e garantias.
              </p>
              <div className="flex-1 space-y-2">
                <Textarea
                  className="min-h-[300px] resize-y"
                  value={formData.condicoes_comerciais}
                  onChange={(e) =>
                    setFormData({ ...formData, condicoes_comerciais: e.target.value })
                  }
                  placeholder="30% no aceite, 70% na entrega. Prazo de execução de 45 dias..."
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-50/80 border-t p-6 rounded-b-lg">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="w-[120px]"
          >
            Voltar
          </Button>
          {step < 3 ? (
            <Button
              className="w-[120px] bg-primary"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              Avançar
            </Button>
          ) : (
            <Button
              className="w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={loading}
            >
              Salvar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

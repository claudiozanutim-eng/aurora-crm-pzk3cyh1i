import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClienteEContato } from '@/services/clientes'

const clientSchema = z
  .object({
    tipo: z.enum(['PF', 'PJ']),
    nome: z.string().min(3, 'Nome/Razão Social obrigatório'),
    nome_fantasia: z.string().optional(),
    documento: z.string().min(11, 'Documento obrigatório'),
    segmento: z.enum(['Educação', 'Tecnologia', 'Varejo', 'Outro']),
    porte: z.enum(['Micro', 'Pequeno', 'Médio', 'Grande']),
    status: z.enum(['Ativo', 'Inativo', 'Lead']),
    nome_contato: z.string().min(3, 'Nome do contato obrigatório'),
    email: z.string().email('E-mail inválido'),
    telefone: z.string().min(14, 'Telefone inválido'),
    cargo: z.string().optional(),
    data_aniversario: z.string().optional(),
  })
  .refine(
    (data) => {
      const docsLength = data.documento.replace(/\D/g, '').length
      return data.tipo === 'PJ' ? docsLength === 14 : docsLength === 11
    },
    {
      message: 'Documento inválido',
      path: ['documento'],
    },
  )

type FormData = z.infer<typeof clientSchema>

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

interface ClienteFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ClienteFormSheet({ open, onOpenChange, onSuccess }: ClienteFormSheetProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      tipo: 'PJ',
      status: 'Lead',
      segmento: 'Educação',
      porte: 'Pequeno',
    },
  })

  const tipo = watch('tipo')

  const handleNext = async () => {
    const isStep1Valid = await trigger([
      'tipo',
      'nome',
      'nome_fantasia',
      'documento',
      'segmento',
      'porte',
      'status',
    ])
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = tipo === 'PJ' ? maskCNPJ(e.target.value) : maskCPF(e.target.value)
    setValue('documento', masked, { shouldValidate: true })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('telefone', maskPhone(e.target.value), { shouldValidate: true })
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      await createClienteEContato(
        {
          tipo: data.tipo,
          nome: data.nome,
          nome_fantasia: data.nome_fantasia,
          documento: data.documento,
          segmento: data.segmento,
          porte: data.porte,
          status: data.status,
          data_cadastro: new Date().toISOString(),
        },
        {
          nome: data.nome_contato,
          email: data.email,
          telefone: data.telefone,
          cargo: data.cargo,
          data_aniversario: data.data_aniversario
            ? new Date(data.data_aniversario).toISOString()
            : undefined,
        },
      )
      toast.success('Cliente cadastrado com sucesso!')
      reset()
      setStep(1)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente. Verifique se o documento já existe.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Cliente</SheetTitle>
          <SheetDescription>
            {step === 1
              ? 'Preencha os dados do cliente.'
              : 'Preencha os dados do contato principal.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Tabs
                value={tipo}
                onValueChange={(v) => {
                  setValue('tipo', v as 'PF' | 'PJ')
                  setValue('documento', '')
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="PJ">Pessoa Jurídica (PJ)</TabsTrigger>
                  <TabsTrigger value="PF">Pessoa Física (PF)</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="nome">{tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder={tipo === 'PJ' ? 'Empresa Ltda' : 'João da Silva'}
                />
                {errors.nome && <span className="text-sm text-red-500">{errors.nome.message}</span>}
              </div>

              {tipo === 'PJ' && (
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input id="nome_fantasia" {...register('nome_fantasia')} placeholder="Empresa" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="documento">{tipo === 'PJ' ? 'CNPJ' : 'CPF'} *</Label>
                <Input
                  id="documento"
                  value={watch('documento') || ''}
                  onChange={handleDocumentChange}
                  placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                />
                {errors.documento && (
                  <span className="text-sm text-red-500">{errors.documento.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segmento *</Label>
                  <Controller
                    name="segmento"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Educação">Educação</SelectItem>
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                          <SelectItem value="Varejo">Varejo</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.segmento && (
                    <span className="text-sm text-red-500">{errors.segmento.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Porte *</Label>
                  <Controller
                    name="porte"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Micro">Micro</SelectItem>
                          <SelectItem value="Pequeno">Pequeno</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Grande">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.porte && (
                    <span className="text-sm text-red-500">{errors.porte.message}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              >
                Próximo Passo
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_contato">Nome do Contato *</Label>
                <Input id="nome_contato" {...register('nome_contato')} placeholder="Maria Silva" />
                {errors.nome_contato && (
                  <span className="text-sm text-red-500">{errors.nome_contato.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="maria@empresa.com"
                />
                {errors.email && (
                  <span className="text-sm text-red-500">{errors.email.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={watch('telefone') || ''}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <span className="text-sm text-red-500">{errors.telefone.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" {...register('cargo')} placeholder="Diretor, Gerente..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                <Input id="data_aniversario" type="date" {...register('data_aniversario')} />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}

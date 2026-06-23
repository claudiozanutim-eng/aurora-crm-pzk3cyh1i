import { useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { useEffect } from 'react'
import { createClienteEContatos, updateClienteEContatos, type Cliente } from '@/services/clientes'

function isValidCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let soma = 0,
    resto
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(9, 10))) return false
  soma = 0
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(10, 11))) return false
  return true
}

function isValidCNPJ(cnpj: string) {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  const digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false
  tamanho = tamanho + 1
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false
  return true
}

const clientSchema = z
  .object({
    tipo: z.enum(['PF', 'PJ']),
    nome: z.string().min(3, 'Nome/Razão Social obrigatório'),
    nome_fantasia: z.string().optional(),
    documento: z.string().optional(),
    segmento: z.enum([
      'Educação',
      'Tecnologia',
      'Varejo',
      'Agro',
      'Indústria',
      'Serviços',
      'Cooperativa',
      'Outro',
    ]),
    porte: z.enum(['Micro', 'Pequeno', 'Médio', 'Grande']),
    status: z.enum(['Ativo', 'Inativo', 'Lead']),
    contatos: z
      .array(
        z.object({
          nome_contato: z.string().optional(),
          email: z.string().trim().email('E-mail inválido').or(z.literal('')).optional(),
          telefone: z
            .string()
            .optional()
            .refine((val) => !val || val.length >= 14, 'Telefone inválido'),
          cargo: z.string().optional(),
          data_aniversario: z.string().optional(),
        }),
      )
      .default([{}]),
    pf_email: z.string().trim().email('E-mail inválido').or(z.literal('')).optional(),
    pf_telefone: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 14, 'Telefone inválido'),
  })
  .refine(
    (data) => {
      const cleanDoc = data.documento?.replace(/\D/g, '') || ''
      if (cleanDoc.length === 0) return true
      return data.tipo === 'PJ'
        ? cleanDoc.length === 14 && isValidCNPJ(cleanDoc)
        : cleanDoc.length === 11 && isValidCPF(cleanDoc)
    },
    {
      message: 'Documento inválido',
      path: ['documento'],
    },
  )
  .refine(
    (data) => {
      if (data.tipo === 'PF') {
        const hasEmail = !!data.pf_email?.trim()
        const hasPhone = !!data.pf_telefone?.trim()
        return hasEmail || hasPhone
      }
      return true
    },
    {
      message: 'Salvar pelo menos uma forma de contato com a pessoa',
      path: ['pf_telefone'],
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
  initialData?: Cliente | null
}

export function ClienteFormSheet({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: ClienteFormSheetProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmEmptyDoc, setShowConfirmEmptyDoc] = useState(false)
  const [showConfirmEmptyContact, setShowConfirmEmptyContact] = useState(false)
  const [pendingData, setPendingData] = useState<FormData | null>(null)

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
      pf_email: '',
      pf_telefone: '',
      contatos: [
        {
          nome_contato: '',
          email: '',
          telefone: '',
          cargo: '',
          data_aniversario: '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contatos',
  })

  const tipo = watch('tipo')

  useEffect(() => {
    if (open) {
      if (initialData) {
        const isPF = initialData.tipo === 'PF'
        const contatos = initialData.expand?.contatos_via_cliente_id || []

        let pf_email = ''
        let pf_telefone = ''
        let mappedContatos = [
          { nome_contato: '', email: '', telefone: '', cargo: '', data_aniversario: '' },
        ]

        if (isPF && contatos.length > 0) {
          const c = contatos[0]
          pf_email = c.email || ''
          pf_telefone = c.telefone || ''
        } else if (!isPF && contatos.length > 0) {
          mappedContatos = contatos.map((c) => ({
            nome_contato: c.nome || '',
            email: c.email || '',
            telefone: c.telefone || '',
            cargo: c.cargo || '',
            data_aniversario: c.data_aniversario ? c.data_aniversario.substring(0, 10) : '',
          }))
        }

        const rawDoc = initialData.documento || ''
        const maskedDoc = isPF ? maskCPF(rawDoc) : maskCNPJ(rawDoc)

        reset({
          tipo: initialData.tipo,
          nome: initialData.nome,
          nome_fantasia: initialData.nome_fantasia || '',
          documento: maskedDoc,
          segmento: initialData.segmento,
          porte: initialData.porte,
          status: initialData.status,
          pf_email,
          pf_telefone,
          contatos: mappedContatos,
        })
      } else {
        reset({
          tipo: 'PJ',
          status: 'Lead',
          segmento: 'Educação',
          porte: 'Pequeno',
          pf_email: '',
          pf_telefone: '',
          documento: '',
          nome: '',
          nome_fantasia: '',
          contatos: [
            { nome_contato: '', email: '', telefone: '', cargo: '', data_aniversario: '' },
          ],
        })
      }
      setStep(1)
    }
  }, [open, initialData, reset])

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

  const handlePhoneChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(`contatos.${index}.telefone`, maskPhone(e.target.value), { shouldValidate: true })
  }

  const checkDocumento = (data: FormData) => {
    const cleanDoc = data.documento?.replace(/\D/g, '') || ''
    if (cleanDoc.length === 0) {
      setShowConfirmEmptyDoc(true)
    } else {
      checkContacts(data)
    }
  }

  const checkContacts = (data: FormData) => {
    if (data.tipo === 'PF') {
      executeSubmit(data)
      return
    }

    const hasAnyContact = data.contatos.some(
      (c) =>
        c.nome_contato?.trim() ||
        c.email?.trim() ||
        c.telefone?.trim() ||
        c.cargo?.trim() ||
        c.data_aniversario?.trim(),
    )
    if (!hasAnyContact) {
      setShowConfirmEmptyContact(true)
    } else {
      executeSubmit(data)
    }
  }

  const onSubmit = async (data: FormData) => {
    setPendingData(data)
    checkDocumento(data)
  }

  const executeSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)

      let validContacts = []

      if (data.tipo === 'PF') {
        validContacts = [
          {
            nome: data.nome,
            email: data.pf_email?.trim() || '',
            telefone: data.pf_telefone?.trim() || '',
            cargo: '',
          },
        ]
      } else {
        validContacts = data.contatos
          .filter(
            (c) =>
              c.nome_contato?.trim() ||
              c.email?.trim() ||
              c.telefone?.trim() ||
              c.cargo?.trim() ||
              c.data_aniversario?.trim(),
          )
          .map((c) => ({
            nome: c.nome_contato?.trim() || '',
            email: c.email?.trim() || '',
            telefone: c.telefone?.trim() || '',
            cargo: c.cargo?.trim() || '',
            data_aniversario: c.data_aniversario
              ? new Date(c.data_aniversario).toISOString()
              : undefined,
          }))
      }

      if (initialData) {
        await updateClienteEContatos(
          initialData.id,
          {
            tipo: data.tipo,
            nome: data.nome,
            nome_fantasia: data.tipo === 'PJ' ? data.nome_fantasia : undefined,
            documento: data.documento || '',
            segmento: data.segmento,
            porte: data.porte,
            status: data.status,
          },
          validContacts,
        )
        toast.success('Cliente atualizado com sucesso!')
      } else {
        await createClienteEContatos(
          {
            tipo: data.tipo,
            nome: data.nome,
            nome_fantasia: data.tipo === 'PJ' ? data.nome_fantasia : undefined,
            documento: data.documento || '',
            segmento: data.segmento,
            porte: data.porte,
            status: data.status,
            data_cadastro: new Date().toISOString(),
          },
          validContacts,
        )
        toast.success('Cliente cadastrado com sucesso!')
      }

      setStep(1)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Erro ao salvar cliente. Verifique se os dados estão corretos.')
    } finally {
      setIsLoading(false)
      setShowConfirmEmptyDoc(false)
      setShowConfirmEmptyContact(false)
      setPendingData(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
          <SheetDescription>
            {step === 1 ? 'Preencha os dados do cliente.' : 'Adicione os contatos do cliente.'}
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
                  if (v === 'PJ') {
                    setValue('pf_email', '')
                    setValue('pf_telefone', '')
                  }
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
                <Label htmlFor="documento">{tipo === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
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

              {tipo === 'PJ' && (
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
                            <SelectItem value="Agro">Agro</SelectItem>
                            <SelectItem value="Indústria">Indústria</SelectItem>
                            <SelectItem value="Serviços">Serviços</SelectItem>
                            <SelectItem value="Cooperativa">Cooperativa</SelectItem>
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
              )}

              {tipo === 'PF' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf_email">E-mail</Label>
                    <Input
                      id="pf_email"
                      type="email"
                      {...register('pf_email')}
                      placeholder="email@exemplo.com"
                    />
                    {errors.pf_email && (
                      <span className="text-sm text-red-500">{errors.pf_email.message}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pf_telefone">Telefone</Label>
                    <Input
                      id="pf_telefone"
                      value={watch('pf_telefone') || ''}
                      onChange={(e) => {
                        setValue('pf_telefone', maskPhone(e.target.value), { shouldValidate: true })
                      }}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.pf_telefone && (
                      <span className="text-sm text-red-500">{errors.pf_telefone.message}</span>
                    )}
                  </div>
                </div>
              )}

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

              {tipo === 'PJ' ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                >
                  Próximo Passo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                >
                  {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Salvar'}
                </Button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-md relative bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Contato {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 h-8 px-2"
                        onClick={() => remove(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`nome_contato-${index}`}>Nome do Contato</Label>
                    <Input
                      id={`nome_contato-${index}`}
                      {...register(`contatos.${index}.nome_contato`)}
                      placeholder="Maria Silva"
                    />
                    {errors.contatos?.[index]?.nome_contato && (
                      <span className="text-sm text-red-500">
                        {errors.contatos[index]?.nome_contato?.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`}>E-mail</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      {...register(`contatos.${index}.email`)}
                      placeholder="maria@empresa.com"
                    />
                    {errors.contatos?.[index]?.email && (
                      <span className="text-sm text-red-500">
                        {errors.contatos[index]?.email?.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`telefone-${index}`}>Telefone</Label>
                    <Input
                      id={`telefone-${index}`}
                      value={watch(`contatos.${index}.telefone`) || ''}
                      onChange={(e) => handlePhoneChange(index, e)}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.contatos?.[index]?.telefone && (
                      <span className="text-sm text-red-500">
                        {errors.contatos[index]?.telefone?.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cargo-${index}`}>Cargo</Label>
                    <Input
                      id={`cargo-${index}`}
                      {...register(`contatos.${index}.cargo`)}
                      placeholder="Diretor, Gerente..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`data_aniversario-${index}`}>Data de Aniversário</Label>
                    <Input
                      id={`data_aniversario-${index}`}
                      type="date"
                      {...register(`contatos.${index}.data_aniversario`)}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  append({
                    nome_contato: '',
                    email: '',
                    telefone: '',
                    cargo: '',
                    data_aniversario: '',
                  })
                }
              >
                + Novo Contato
              </Button>

              <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-4 flex gap-4 z-10">
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
                  {isLoading ? 'Salvando...' : initialData ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </SheetContent>

      <AlertDialog open={showConfirmEmptyDoc} onOpenChange={setShowConfirmEmptyDoc}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cadastrar este cliente sem um CPF/CNPJ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setShowConfirmEmptyDoc(false)
                if (pendingData) checkContacts(pendingData)
              }}
              disabled={isLoading}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmEmptyContact} onOpenChange={setShowConfirmEmptyContact}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que não quer cadastrar um contato para o cliente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setShowConfirmEmptyContact(false)
                if (pendingData) executeSubmit(pendingData)
              }}
              disabled={isLoading}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
            >
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

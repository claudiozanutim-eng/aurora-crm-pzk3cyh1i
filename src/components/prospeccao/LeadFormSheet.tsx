import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createLead, updateLead, Lead } from '@/services/leads'
import { useAuth } from '@/hooks/use-auth'
import { getAllUsers, User } from '@/services/users'
import { useEffect } from 'react'

const formSchema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  contato_nome: z.string().optional(),
  tipo: z.enum(['PF', 'PJ']),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  origem: z.enum(['Indicação', 'Site', 'Redes Sociais', 'Evento', 'Outro']),
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
  prioridade: z.enum(['Alta', 'Média', 'Baixa']),
  tags: z.array(z.string()).default([]),
  vendedor_id: z.string().min(1, 'Selecione um vendedor'),
})

interface LeadFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  leadToEdit?: Lead | null
}

export function LeadFormSheet({ open, onOpenChange, onSuccess, leadToEdit }: LeadFormSheetProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      contato_nome: '',
      tipo: 'PJ',
      telefone: '',
      email: '',
      origem: 'Outro',
      segmento: 'Outro',
      prioridade: 'Média',
      tags: [],
      vendedor_id: '',
    },
  })

  useEffect(() => {
    if (open) {
      getAllUsers().then(setUsers).catch(console.error)
      if (leadToEdit) {
        form.reset({
          nome: leadToEdit.nome,
          contato_nome: leadToEdit.contato_nome || '',
          tipo: leadToEdit.tipo,
          telefone: leadToEdit.telefone || '',
          email: leadToEdit.email || '',
          origem: leadToEdit.origem,
          segmento: leadToEdit.segmento,
          prioridade: leadToEdit.prioridade,
          tags: leadToEdit.tags || [],
          vendedor_id: leadToEdit.vendedor_id,
        })
      } else {
        form.reset({
          nome: '',
          contato_nome: '',
          tipo: 'PJ',
          telefone: '',
          email: '',
          origem: 'Outro',
          segmento: 'Outro',
          prioridade: 'Média',
          tags: [],
          vendedor_id: user?.id || '',
        })
      }
    }
  }, [open, leadToEdit, user, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      if (leadToEdit) {
        await updateLead(leadToEdit.id, values)
        toast({ title: 'Lead atualizado com sucesso' })
      } else {
        await createLead({
          ...values,
          status: 'Novos Leads',
        })
        toast({ title: 'Lead criado com sucesso' })
      }
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: leadToEdit ? 'Erro ao atualizar lead' : 'Erro ao criar lead',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[500px]">
        <SheetHeader className="mb-6">
          <SheetTitle>{leadToEdit ? 'Editar Lead' : 'Novo Lead'}</SheetTitle>
          <SheetDescription>
            {leadToEdit
              ? 'Atualize as informações do lead.'
              : 'Cadastre um novo lead no funil de prospecção.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa/Pessoa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa ou pessoa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="segmento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contato_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Indicação', 'Site', 'Redes Sociais', 'Evento', 'Outro'].map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === 'nenhuma' ? [] : [val])}
                    value={field.value?.[0] || 'nenhuma'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhuma">Sem tag</SelectItem>
                      <SelectItem value="Frio">Frio</SelectItem>
                      <SelectItem value="Quente">Quente</SelectItem>
                      <SelectItem value="Parceria">Parceria</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendedor Responsável *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o vendedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users
                        .filter((u) => u.ativo !== false || u.id === field.value)
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-6">
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? 'Salvando...' : leadToEdit ? 'Salvar Alterações' : 'Salvar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

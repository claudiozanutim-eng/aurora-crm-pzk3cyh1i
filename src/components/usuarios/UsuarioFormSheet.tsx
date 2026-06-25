import { useEffect, useState } from 'react'
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
import { toast } from 'sonner'
import { createUser, updateUser, User } from '@/services/users'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  perfil: z.enum(['Admin', 'Usuário']),
  password: z.string().optional(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit: User | null
  onSuccess: () => void
}

export function UsuarioFormSheet({ open, onOpenChange, userToEdit, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      perfil: 'Usuário',
      password: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        form.reset({
          name: userToEdit.name || '',
          email: userToEdit.email || '',
          perfil: userToEdit.perfil || 'Usuário',
          password: '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          perfil: 'Usuário',
          password: '',
        })
      }
    }
  }, [open, userToEdit, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      if (userToEdit) {
        const payload: any = {
          name: values.name,
          email: values.email,
          perfil: values.perfil,
        }
        await updateUser(userToEdit.id, payload)
        toast.success('Usuário atualizado com sucesso')
      } else {
        if (!values.password) {
          form.setError('password', { message: 'A senha é obrigatória para novos usuários' })
          setLoading(false)
          return
        }
        if (values.password.length < 8) {
          form.setError('password', { message: 'A senha deve ter pelo menos 8 caracteres' })
          setLoading(false)
          return
        }
        await createUser({
          name: values.name,
          email: values.email,
          perfil: values.perfil,
          password: values.password,
          passwordConfirm: values.password,
          ativo: true,
        })
        toast.success('Usuário criado com sucesso')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const errors = extractFieldErrors(error)
      if (Object.keys(errors).length > 0) {
        Object.keys(errors).forEach((key) => {
          form.setError(key as any, { message: errors[key] })
        })
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{userToEdit ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
          <SheetDescription>
            {userToEdit
              ? 'Atualize as informações de acesso.'
              : 'Cadastre um novo usuário no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Administrador</SelectItem>
                      <SelectItem value="Usuário">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!userToEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="pt-6 flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                disabled={loading}
              >
                {loading ? 'Salvando...' : userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full text-gray-600"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

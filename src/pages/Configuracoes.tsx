import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { getAllUsers, updateUserStatus, User } from '@/services/users'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

export default function Configuracoes() {
  const [users, setUsers] = useState<User[]>([])
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await updateUserStatus(id, checked)
      toast({ title: checked ? 'Usuário ativado' : 'Usuário desativado' })
      loadUsers()
    } catch (e) {
      toast({ title: 'Erro ao atualizar usuário', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Configurações
        </h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências e dados da conta.</p>
      </div>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
          <CardDescription>Atualize suas informações pessoais e foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <img
              src={
                currentUser?.avatar
                  ? pb.files.getUrl(currentUser, currentUser.avatar)
                  : 'https://img.usecurling.com/ppl/medium?gender=female&seed=1'
              }
              alt="Profile"
              className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover"
            />
            <Button variant="outline" className="text-gray-600 border-gray-300">
              Alterar Avatar
            </Button>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={currentUser?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <Input id="email" type="email" defaultValue={currentUser?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input id="role" defaultValue="Comercial" disabled />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Ative ou desative o acesso e atribuições de usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50"
              >
                <div className="mb-3 sm:mb-0">
                  <p className="font-semibold text-gray-900">{u.name || 'Sem nome'}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${u.ativo !== false ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {u.ativo !== false ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    id={`ativo-${u.id}`}
                    checked={u.ativo !== false}
                    onCheckedChange={(c) => handleToggleActive(u.id, c)}
                    disabled={u.id === currentUser?.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

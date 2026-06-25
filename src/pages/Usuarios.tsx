import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getAllUsers, updateUserStatus, User } from '@/services/users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UserCog, Edit, Power, PowerOff } from 'lucide-react'
import { UsuarioFormSheet } from '@/components/usuarios/UsuarioFormSheet'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'

export default function Usuarios() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const loadData = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && currentUser.perfil !== 'Admin') {
      toast.error('Acesso Restrito. Você não tem permissão para acessar esta página.')
      navigate('/', { replace: true })
    } else if (currentUser) {
      loadData()
    }
  }, [currentUser, navigate])

  useRealtime('users', () => {
    if (currentUser && currentUser.perfil === 'Admin') {
      loadData()
    }
  })

  if (!currentUser || currentUser.perfil !== 'Admin') {
    return null
  }

  const toggleStatus = async (user: User) => {
    try {
      const newStatus = user.ativo === false ? true : false
      await updateUserStatus(user.id, newStatus)
      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`)
      loadData()
    } catch {
      toast.error('Erro ao atualizar status do usuário')
    }
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setSheetOpen(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      <div className="flex-none p-6 border-b bg-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCog className="h-6 w-6 text-primary" />
              Gestão de Usuários
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os acessos e perfis da equipe</p>
          </div>
          <Button onClick={handleNew} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.name || 'Sem nome'}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={u.perfil === 'Admin' ? 'default' : 'secondary'}
                        className={
                          u.perfil === 'Admin'
                            ? 'bg-[#FF6B00] hover:bg-[#FF6B00]/90'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {u.perfil || 'Usuário'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={u.ativo !== false ? 'outline' : 'secondary'}
                        className={
                          u.ativo !== false
                            ? 'text-green-600 border-green-200 bg-green-50'
                            : 'text-gray-500 bg-gray-100'
                        }
                      >
                        {u.ativo !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(u)}
                        title="Editar"
                        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(u)}
                        title={u.ativo !== false ? 'Desativar' : 'Ativar'}
                        className={
                          u.ativo !== false
                            ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                        }
                      >
                        {u.ativo !== false ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UsuarioFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userToEdit={editingUser}
        onSuccess={loadData}
      />
    </div>
  )
}

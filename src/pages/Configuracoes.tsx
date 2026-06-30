import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { DangerZone } from '@/components/configuracoes/DangerZone'
import { BackupExport } from '@/components/configuracoes/BackupExport'
import { BackupManagement } from '@/components/configuracoes/BackupManagement'
import { AuditLogs } from '@/components/configuracoes/AuditLogs'

export default function Configuracoes() {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '')
      setEmail(currentUser.email || '')
    }
  }, [currentUser])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await pb.collection('users').update(currentUser.id, formData)
      toast.success('Avatar atualizado com sucesso!')
    } catch (err) {
      toast.error('Erro ao atualizar avatar')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      if (email !== currentUser.email) {
        await pb.collection('users').requestEmailChange(email)
        toast.info('Um e-mail de confirmação foi enviado para o novo endereço.')
      }
      if (name !== currentUser.name) {
        await pb.collection('users').update(currentUser.id, { name })
      }
      toast.success('Perfil atualizado com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentUser) return
    if (password !== passwordConfirm) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoadingPassword(true)
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword,
        password,
        passwordConfirm,
      })
      toast.success('Senha atualizada com sucesso!')
      setOldPassword('')
      setPassword('')
      setPasswordConfirm('')
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (errors.oldPassword) toast.error(`Senha atual: ${errors.oldPassword}`)
      else if (errors.password) toast.error(`Nova senha: ${errors.password}`)
      else toast.error(getErrorMessage(err))
    } finally {
      setLoadingPassword(false)
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
                  ? pb.files.getURL(currentUser, currentUser.avatar)
                  : 'https://img.usecurling.com/ppl/medium?gender=female&seed=1'
              }
              alt="Profile"
              className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <Button
              variant="outline"
              className="text-gray-600 border-gray-300"
              onClick={() => fileInputRef.current?.click()}
            >
              Alterar Avatar
            </Button>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil de Acesso</Label>
              <Input id="role" value={currentUser?.perfil || 'Usuário'} disabled />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Altere a sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Senha Atual</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              onClick={handleChangePassword}
              disabled={loadingPassword || !oldPassword || !password || !passwordConfirm}
            >
              {loadingPassword ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentUser?.perfil === 'Admin' && <BackupExport />}
      {currentUser?.perfil === 'Admin' && <BackupManagement />}
      {currentUser?.perfil === 'Admin' && <AuditLogs />}
      {currentUser?.perfil === 'Admin' && <DangerZone />}
    </div>
  )
}

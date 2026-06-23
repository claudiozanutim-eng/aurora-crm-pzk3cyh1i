import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Configurações
        </h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências e dados da conta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
          <CardDescription>Atualize suas informações pessoais e foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <img
              src="https://img.usecurling.com/ppl/medium?gender=female&seed=1"
              alt="Profile"
              className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover"
            />
            <Button variant="outline">Alterar Avatar</Button>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue="Ana Gerente" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <Input id="email" type="email" defaultValue="ana.gerente@iceduc.com.br" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input id="role" defaultValue="Gerente Comercial" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" defaultValue="(11) 98765-4321" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-primary hover:bg-primary/90">Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências do Sistema</CardTitle>
          <CardDescription>
            Configure como o Aurora CRM deve se comportar para você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 italic">
            Mais configurações estarão disponíveis em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

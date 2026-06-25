import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import auroraLogo from '@/assets/aurora-logo-5bbbb.png'

export default function Login() {
  const [email, setEmail] = useState('luizfelipe.pateo@iceduc.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await signIn(email, password)
    if (error) {
      toast.error(error.message || 'Credenciais inválidas')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-subtle border border-gray-100">
        <div className="flex justify-center mb-6">
          <img src={auroraLogo} alt="Aurora CRM" className="h-56 w-auto object-contain" />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}

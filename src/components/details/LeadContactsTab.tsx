import { useState } from 'react'
import { Lead, updateLead } from '@/services/leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export function LeadContactsTab({ lead }: { lead: Lead }) {
  const { toast } = useToast()
  const [data, setData] = useState({
    contato_nome: lead.contato_nome || '',
    email: lead.email || '',
    telefone: lead.telefone || '',
  })

  const handleChange = (field: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateLead(lead.id, data)
      toast({ title: 'Contato do lead atualizado.' })
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Informações de Contato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Contato</Label>
            <Input
              value={data.contato_nome}
              onChange={(e) => handleChange('contato_nome', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={data.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
            />
          </div>
          <Button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
            Salvar Contato
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

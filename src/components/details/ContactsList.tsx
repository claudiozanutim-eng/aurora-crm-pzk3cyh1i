import { useEffect, useState } from 'react'
import {
  getContatosByClienteId,
  createContato,
  updateContato,
  setContatoPrincipal,
} from '@/services/contatos'
import { Contato } from '@/services/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { User, Phone, Mail, Briefcase, Star, Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export function ContactsList({ clienteId }: { clienteId: string }) {
  const { toast } = useToast()
  const [contatos, setContatos] = useState<Contato[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contato | null>(null)

  const load = async () => {
    try {
      const data = await getContatosByClienteId(clienteId)
      setContatos(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [clienteId])
  useRealtime('contatos', load)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      if (editing) await updateContato(editing.id, data)
      else
        await createContato({ ...data, cliente_id: clienteId, is_principal: contatos.length === 0 })
      toast({ title: 'Contato salvo com sucesso' })
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const openEdit = (c: Contato) => {
    setEditing(c)
    setOpen(true)
  }

  const handlePrincipal = async (id: string) => {
    try {
      await setContatoPrincipal(clienteId, id)
      toast({ title: 'Contato principal atualizado' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Contatos Associados</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Contato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="nome" defaultValue={editing?.nome} required />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input name="email" type="email" defaultValue={editing?.email} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input name="telefone" defaultValue={editing?.telefone} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input name="cargo" defaultValue={editing?.cargo} />
              </div>
              <Button type="submit" className="w-full bg-[#FF6B00]">
                Salvar Contato
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contatos.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> {c.nome}
                  {c.is_principal && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
                      Principal
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!c.is_principal && (
                    <Button size="sm" variant="outline" onClick={() => handlePrincipal(c.id)}>
                      <Star className="w-4 h-4 text-yellow-500 mr-1" /> Definir Principal
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    Editar
                  </Button>
                </div>
              </div>
              {c.cargo && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> {c.cargo}
                </div>
              )}
              {c.email && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {c.email}
                </div>
              )}
              {c.telefone && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {c.telefone}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

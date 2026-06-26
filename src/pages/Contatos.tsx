import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { getClientes, type Cliente, type Contato } from '@/services/clientes'
import { getAllContatos, createContato } from '@/services/contatos'

export default function Contatos() {
  const navigate = useNavigate()
  const [contatos, setContatos] = useState<(Contato & { expand?: { cliente_id?: Cliente } })[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const data = await getAllContatos()
      setContatos(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    getClientes().then(setClientes).catch(console.error)
  }, [])

  useRealtime('contatos', loadData)
  useRealtime('clientes', () => {
    getClientes().then(setClientes).catch(console.error)
  })

  const filteredContatos = useMemo(() => {
    return contatos.filter((c) => {
      const term = search.toLowerCase()
      const matchName = c.nome?.toLowerCase().includes(term)
      const matchEmail = c.email?.toLowerCase().includes(term)
      const matchClient = c.expand?.cliente_id?.nome?.toLowerCase().includes(term)
      return matchName || matchEmail || matchClient
    })
  }, [contatos, search])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())

    const clientContatos = contatos.filter((c) => c.cliente_id === data.cliente_id)
    const isFirst = clientContatos.length === 0

    try {
      await createContato({
        nome: data.nome as string,
        email: data.email as string,
        telefone: data.telefone as string,
        cargo: data.cargo as string,
        cliente_id: data.cliente_id as string,
        is_principal: isFirst,
      })
      toast.success('Contato criado com sucesso')
      setIsModalOpen(false)
    } catch (e) {
      toast.error('Erro ao criar contato')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Contatos</h1>
          <p className="text-gray-500 mt-1">
            Gerencie todos os contatos vinculados aos seus clientes.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#e55320] hover:bg-[#e55320]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, e-mail ou empresa..."
              className="pl-8 bg-gray-50 border-gray-200 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Empresa / Cliente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContatos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContatos.map((contato) => (
                  <TableRow
                    key={contato.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clientes/${contato.cliente_id}`)}
                  >
                    <TableCell className="font-medium text-gray-900 flex items-center gap-2">
                      {contato.nome || '-'}
                      {contato.is_principal && (
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-[#e55320] border-[#e55320]/20 flex items-center gap-1 text-[10px] py-0 px-1.5 h-5 shrink-0"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Principal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{contato.cargo || '-'}</TableCell>
                    <TableCell className="text-gray-500">{contato.telefone || '-'}</TableCell>
                    <TableCell className="text-gray-500">{contato.email || '-'}</TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {contato.expand?.cliente_id?.nome || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input name="nome" required />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input name="telefone" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input name="cargo" />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select name="cliente_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-[#e55320] hover:bg-[#e55320]/90 text-white">
              Salvar Contato
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

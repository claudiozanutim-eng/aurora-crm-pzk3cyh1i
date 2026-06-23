import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Search, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getClientes, type Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { ClienteFormSheet } from '@/components/clientes/ClienteFormSheet'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [tipoFilter, setTipoFilter] = useState('Todos')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const loadData = async () => {
    try {
      const data = await getClientes()
      setClientes(data)
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('clientes', () => {
    loadData()
  })

  useRealtime('contatos', () => {
    loadData()
  })

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(search.toLowerCase()) || c.documento.includes(search)
      const matchStatus = statusFilter === 'Todos' || c.status === statusFilter
      const matchTipo = tipoFilter === 'Todos' || c.tipo === tipoFilter
      return matchSearch && matchStatus && matchTipo
    })
  }, [clientes, search, statusFilter, tipoFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie sua base de clientes e contatos.</p>
        </div>
        <Button
          onClick={() => setIsSheetOpen(true)}
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou documento..."
              className="pl-8 bg-gray-50 border-gray-200 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px] bg-gray-50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-[140px] bg-gray-50">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Tipos</SelectItem>
                <SelectItem value="PJ">PJ</SelectItem>
                <SelectItem value="PF">PF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Empresa / Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato Principal</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((client) => {
                  const contatoPrincipal =
                    client.expand?.contatos_via_cliente_id?.find((c) => c.is_principal) ||
                    client.expand?.contatos_via_cliente_id?.[0]

                  return (
                    <TableRow key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {client.nome}
                        {client.nome_fantasia && (
                          <span className="block text-xs text-gray-500 font-normal">
                            {client.nome_fantasia}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {client.documento}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contatoPrincipal?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {contatoPrincipal?.email || '-'}
                      </TableCell>
                      <TableCell className="text-gray-500">{client.segmento}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === 'Ativo'
                              ? 'default'
                              : client.status === 'Lead'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            client.status === 'Ativo'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : client.status === 'Lead'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ClienteFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={() => loadData()}
      />
    </div>
  )
}

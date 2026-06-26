import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPropostas,
  deleteProposta,
  updateProposta,
  createProposta,
  type Proposta,
} from '@/services/propostas'
import { getClientes, type Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Send,
  Copy,
  Trash2,
  Search,
  CheckCircle,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const statusColors: Record<string, string> = {
  Rascunho: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  Enviada: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  Aprovada: 'bg-green-100 text-green-700 hover:bg-green-200',
  Rejeitada: 'bg-red-100 text-red-700 hover:bg-red-200',
  Expirada: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
}

export default function Propostas() {
  const navigate = useNavigate()
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [clienteFilter, setClienteFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [pData, cData] = await Promise.all([getPropostas(), getClientes()])
      setPropostas(pData)
      setClientes(cData)
    } catch (error) {
      toast.error('Erro ao carregar propostas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('propostas', loadData)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta proposta?')) return
    try {
      await deleteProposta(id)
      toast.success('Proposta excluída com sucesso')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir proposta')
    }
  }

  const handleSend = async (p: Proposta) => {
    try {
      await updateProposta(p.id, {
        status: 'Enviada',
        data_envio: new Date().toISOString().replace('T', ' '),
      })
      toast.success('Proposta marcada como enviada')
      loadData()
    } catch (error) {
      toast.error('Erro ao enviar proposta')
    }
  }

  const handleDuplicate = async (p: Proposta) => {
    try {
      await createProposta({
        titulo: `Cópia de ${p.titulo}`,
        cliente_id: p.cliente_id,
        negocio_id: p.negocio_id,
        valor_total: p.valor_total,
        descricao_servicos: p.descricao_servicos,
        condicoes_comerciais: p.condicoes_comerciais,
        validade_dias: p.validade_dias,
        status: 'Rascunho',
      })
      toast.success('Proposta duplicada com sucesso')
      loadData()
    } catch (error) {
      toast.error('Erro ao duplicar proposta')
    }
  }

  const filtered = propostas.filter((p) => {
    const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter
    const matchCliente = clienteFilter === 'Todos' || p.cliente_id === clienteFilter
    return matchSearch && matchStatus && matchCliente
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Propostas Comerciais
          </h1>
          <p className="text-gray-500 mt-1">Gerencie documentos e cotações para seus clientes.</p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => navigate('/propostas/nova')}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            {Object.keys(statusColors).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clienteFilter} onValueChange={setClienteFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criação</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhuma proposta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.titulo}
                      {p.arquivo_aprovado && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>Proposta Aprovada (Arquivo Anexado)</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{p.expand?.cliente_id?.nome || '-'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      p.valor_total,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${statusColors[p.status]} border-none`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/propostas/${p.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={p.status !== 'Rascunho'}
                          onClick={() => navigate(`/propostas/${p.id}/editar`)}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={p.status !== 'Rascunho'}
                          onClick={() => handleSend(p)}
                        >
                          <Send className="mr-2 h-4 w-4" /> Enviar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(p)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

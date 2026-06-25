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
import {
  Plus,
  Search,
  MoreHorizontal,
  Download,
  Upload,
  Calendar,
  MessageCircle,
  Users,
  CheckCircle2,
  UserPlus,
  AlertCircle,
  Loader2,
} from 'lucide-react'
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
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getClientes, deleteCliente, type Cliente } from '@/services/clientes'
import { Interacao } from '@/services/interacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ClienteFormSheet } from '@/components/clientes/ClienteFormSheet'
import { ClienteImportDialog } from '@/components/clientes/ClienteImportDialog'
import { TagBadge } from '@/components/ui/tag-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function Clientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [tipoFilter, setTipoFilter] = useState('Todos')
  const [sortOption, setSortOption] = useState('nome-asc')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Cliente | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [taskClient, setTaskClient] = useState<Cliente | null>(null)
  const [interactionClient, setInteractionClient] = useState<Cliente | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
  }, [])

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (isExporting || filteredClientes.length === 0) return
    setIsExporting(true)
    const toastId = toast.loading(`Exportando clientes para ${format.toUpperCase()}...`)

    try {
      const clientIds = filteredClientes.map((c) => c.id)

      const res = await pb.send('/backend/v1/spreadsheet/export', {
        method: 'POST',
        body: JSON.stringify({
          source: 'clientes',
          ids: clientIds,
          format: format,
          filters: {
            search,
            status: statusFilter,
            tipo: tipoFilter,
            sort: sortOption,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res && res.base64) {
        const binaryStr = atob(res.base64)
        const len = binaryStr.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i)

        const blobType =
          format === 'csv'
            ? 'text/csv;charset=utf-8;'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        const blob = new Blob([bytes], { type: blobType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Exportação concluída com sucesso!', { id: toastId })
      } else {
        toast.error('Erro ao processar o arquivo de exportação', { id: toastId })
      }
    } catch (err) {
      console.error('Export erro:', err)
      toast.error('Erro ao exportar arquivo', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const loadData = async () => {
    try {
      const [data, intData] = await Promise.all([
        getClientes(),
        pb.collection('interacoes').getFullList<Interacao>({ sort: '-data_hora' }),
      ])
      setClientes(data)
      setInteracoes(intData)
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

  useRealtime('interacoes', () => {
    loadData()
  })

  const latestInteracaoByClient = useMemo(() => {
    const map = new Map<string, Interacao>()
    for (const i of interacoes) {
      if (i.cliente_id && !map.has(i.cliente_id)) {
        map.set(i.cliente_id, i)
      }
    }
    return map
  }, [interacoes])

  const filteredClientes = useMemo(() => {
    let result = clientes.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.documento.includes(search) ||
        c.expand?.contatos_via_cliente_id?.some((contato) =>
          contato.email?.toLowerCase().includes(search.toLowerCase()),
        )
      const matchStatus = statusFilter === 'Todos' || c.status === statusFilter
      const matchTipo = tipoFilter === 'Todos' || c.tipo === tipoFilter
      return matchSearch && matchStatus && matchTipo
    })

    result.sort((a, b) => {
      switch (sortOption) {
        case 'nome-asc':
          return (a.nome || '').localeCompare(b.nome || '')
        case 'nome-desc':
          return (b.nome || '').localeCompare(a.nome || '')
        case 'last_contact-desc':
        case 'last_contact-asc': {
          const lastA = latestInteracaoByClient.get(a.id)?.data_hora
          const lastB = latestInteracaoByClient.get(b.id)?.data_hora
          const timeA = lastA ? new Date(lastA).getTime() : 0
          const timeB = lastB ? new Date(lastB).getTime() : 0
          if (sortOption === 'last_contact-desc') {
            return timeB - timeA
          }
          return timeA - timeB
        }
        case 'data_cadastro-desc':
        case 'data_cadastro-asc': {
          const timeA = new Date(a.data_cadastro || a.created).getTime()
          const timeB = new Date(b.data_cadastro || b.created).getTime()
          if (sortOption === 'data_cadastro-desc') {
            return timeB - timeA
          }
          return timeA - timeB
        }
        default:
          return 0
      }
    })

    return result
  }, [clientes, search, statusFilter, tipoFilter, sortOption, latestInteracaoByClient])

  const metrics = useMemo(() => {
    let ativos = 0
    let novos = 0
    let semContato = 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    clientes.forEach((c) => {
      if (c.status === 'Ativo') ativos++
      if (new Date(c.data_cadastro || c.created) >= thirtyDaysAgo) novos++
      if (c.status === 'Ativo') {
        const lastInt = latestInteracaoByClient.get(c.id)
        if (!lastInt || new Date(lastInt.data_hora) < thirtyDaysAgo) semContato++
      }
    })

    return {
      total: clientes.length,
      ativos,
      novos,
      semContato,
    }
  }, [clientes, latestInteracaoByClient])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie sua base de clientes e contatos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white"
                disabled={isExporting || filteredClientes.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Exportar como Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="bg-white">
            <Upload className="mr-2 h-4 w-4" /> Importar
          </Button>
          <Button
            onClick={() => {
              setClientToEdit(null)
              setIsSheetOpen(true)
            }}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.novos}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Contato (&gt;30 dias)</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.semContato}</div>
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center flex-wrap">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou documento..."
              className="pl-8 bg-gray-50 border-gray-200 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full md:w-auto gap-4 flex-wrap">
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

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[220px] bg-gray-50">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="last_contact-desc">Último Contato (Mais recente)</SelectItem>
                <SelectItem value="last_contact-asc">Último Contato (Mais antigo)</SelectItem>
                <SelectItem value="data_cadastro-desc">Cadastro (Mais recente)</SelectItem>
                <SelectItem value="data_cadastro-asc">Cadastro (Mais antigo)</SelectItem>
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
                <TableHead>Tag</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {client.tags && client.tags.length > 0 ? (
                            client.tags.map((t) => <TagBadge key={t} tag={t} />)
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {latestInteracaoByClient.get(client.id) ? (
                          <span className="text-gray-600">
                            {new Date(
                              latestInteracaoByClient.get(client.id)!.data_hora,
                            ).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
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
                        <div className="flex items-center gap-1 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-[#FF6B00]"
                                onClick={() => setTaskClient(client)}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Criar Tarefa</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-[#FF6B00]"
                                onClick={() => setInteractionClient(client)}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar Interação</TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/clientes/${client.id}`, {
                                    state: { from: '/clientes' },
                                  })
                                }
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => setClientToDelete(client)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ClienteImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => loadData()}
      />

      <ClienteFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={() => loadData()}
        initialData={clientToEdit}
      />

      <Dialog open={!!taskClient} onOpenChange={(o) => !o && setTaskClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa - {taskClient?.nome}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!taskClient) return
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd.entries())
              const dataLimiteStr = data.data_limite as string
              const finalDataLimite = dataLimiteStr
                ? new Date(dataLimiteStr).toISOString()
                : new Date().toISOString()
              try {
                await pb.collection('tarefas').create({
                  ...data,
                  status: 'Pendente',
                  data_limite: finalDataLimite,
                  cliente_id: taskClient.id,
                })
                toast.success('Tarefa criada com sucesso.')
                setTaskClient(null)
              } catch (err) {
                toast.error('Erro ao criar tarefa')
              }
            }}
            className="space-y-4"
          >
            <Select name="tipo" required>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Interação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Telefonema">Telefonema</SelectItem>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                <SelectItem value="Enviar Proposta">Enviar Proposta</SelectItem>
              </SelectContent>
            </Select>
            <Input name="descricao" placeholder="Descrição" required />
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Data Limite (opcional)</span>
              <Input name="data_limite" type="datetime-local" />
            </div>
            <Select name="prioridade" defaultValue="Média">
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select name="vendedor_id" defaultValue={user?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              Salvar Tarefa
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!interactionClient} onOpenChange={(o) => !o && setInteractionClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Interação - {interactionClient?.nome}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!interactionClient || !user) return
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd.entries())
              try {
                await pb.collection('interacoes').create({
                  tipo: data.tipo,
                  data_hora: new Date(data.data_hora as string).toISOString(),
                  resumo: data.resumo,
                  vendedor_id: user.id,
                  cliente_id: interactionClient.id,
                })
                toast.success('Interação registrada com sucesso.')
                setInteractionClient(null)
              } catch (err) {
                toast.error('Erro ao registrar interação')
              }
            }}
            className="space-y-4"
          >
            <Select name="tipo" defaultValue="Telefonema" required>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Telefonema">Telefonema</SelectItem>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                <SelectItem value="Enviar Proposta">Enviar Proposta</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Data e Hora</span>
              <Input
                name="data_hora"
                type="datetime-local"
                required
                defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
              />
            </div>
            <Textarea name="resumo" placeholder="Resumo da interação..." required rows={4} />
            <Button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!clientToDelete} onOpenChange={(o) => !o && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.nome}</strong>? Esta
              ação removerá também todos os contatos associados e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (clientToDelete) {
                  try {
                    await deleteCliente(clientToDelete.id)
                    toast.success('Cliente excluído com sucesso')
                    loadData()
                  } catch (e) {
                    toast.error('Erro ao excluir cliente')
                  }
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

import { useState, useEffect } from 'react'
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
import { Plus, Search, Star, Pencil, Download, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useDebounce } from '@/hooks/use-debounce'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getClientes, type Cliente, type Contato } from '@/services/clientes'
import { getContatosPaginated, buildContatosFilter, getAllContatos } from '@/services/contatos'
import { ContatoFormDialog } from '@/components/contatos/ContatoFormDialog'
import { ContatoImportDialog } from '@/components/contatos/ContatoImportDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { displayContactName } from '@/lib/contact-utils'

type ContatoWithExpand = Contato & { expand?: { cliente_id?: Cliente } }

const PAGE_SIZE = 20

export default function Contatos() {
  const navigate = useNavigate()
  const [contatos, setContatos] = useState<ContatoWithExpand[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContato, setEditingContato] = useState<Contato | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getContatosPaginated(page, PAGE_SIZE, debouncedSearch)
        if (result.items.length === 0 && page > 1) {
          setPage(page - 1)
          return
        }
        setContatos(result.items)
        setTotalPages(result.totalPages)
        setTotalItems(result.totalItems)
        const clientData = await getClientes()
        setClientes(clientData)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [page, debouncedSearch, refreshTrigger])

  useRealtime('contatos', () => setRefreshTrigger((t) => t + 1))
  useRealtime('clientes', () => setRefreshTrigger((t) => t + 1))

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (isExporting || totalItems === 0) return
    setIsExporting(true)
    const toastId = toast.loading(`Exportando contatos para ${format.toUpperCase()}...`)
    try {
      const filter = buildContatosFilter(debouncedSearch)
      const allContatos = await pb.collection('contatos').getFullList({ filter, fields: 'id' })
      const contactIds = allContatos.map((c) => c.id)
      const res = await pb.send('/backend/v1/spreadsheet/export', {
        method: 'POST',
        body: JSON.stringify({ source: 'contatos', ids: contactIds, format }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (res?.base64) {
        const binaryStr = atob(res.base64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const blobType =
          format === 'csv'
            ? 'text/csv;charset=utf-8;'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        const blob = new Blob([bytes], { type: blobType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contatos_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Exportação concluída com sucesso!', { id: toastId })
      } else {
        toast.error('Erro ao processar o arquivo de exportação', { id: toastId })
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Erro ao exportar arquivo', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const openEdit = (contato: Contato) => {
    setEditingContato(contato)
    setIsFormOpen(true)
  }
  const openCreate = () => {
    setEditingContato(null)
    setIsFormOpen(true)
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
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white"
                disabled={isExporting || totalItems === 0}
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
          <Button onClick={openCreate} className="bg-[#e55320] hover:bg-[#e55320]/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Novo Contato
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, e-mail ou empresa..."
              className="pl-8 bg-gray-50 border-gray-200 w-full"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Empresa / Cliente</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : contatos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                contatos.map((contato) => (
                  <TableRow
                    key={contato.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clientes/${contato.cliente_id}`)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {displayContactName(
                          contato.nome,
                          contato.expand?.cliente_id?.nome,
                          contato.expand?.cliente_id?.nome_fantasia,
                        )}
                        {contato.is_principal && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-[#e55320] border-[#e55320]/20 flex items-center gap-1 text-[10px] py-0 px-1.5 h-5 shrink-0"
                          >
                            <Star className="w-3 h-3 fill-current" /> Principal
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{contato.telefone || '-'}</TableCell>
                    <TableCell className="text-gray-600">{contato.email || '-'}</TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {contato.expand?.cliente_id?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-[#e55320]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(contato)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar Contato</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ContatoFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => setRefreshTrigger((t) => t + 1)}
        initialData={editingContato}
        clientes={clientes}
      />
      <ContatoImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => setRefreshTrigger((t) => t + 1)}
      />
    </div>
  )
}

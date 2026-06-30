import { useEffect, useState } from 'react'
import { LeadsKanbanBoard } from '@/components/prospeccao/LeadsKanbanBoard'
import { LeadFormSheet } from '@/components/prospeccao/LeadFormSheet'
import { LeadConvertModal } from '@/components/prospeccao/LeadConvertModal'
import { LeadImportDialog } from '@/components/prospeccao/LeadImportDialog'
import { getLeads, Lead, updateLead, deleteLead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload, Loader2, Search } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export default function Prospeccao() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('leads', (e) => {
    if (e.action === 'delete') {
      setLeads((prev) => prev.filter((l) => l.id !== e.record.id))
      return
    }
    pb.collection('leads')
      .getOne<Lead>(e.record.id, { expand: 'cliente_id' })
      .then((record) => {
        setLeads((prev) => {
          const exists = prev.some((l) => l.id === record.id)
          return exists ? prev.map((l) => (l.id === record.id ? record : l)) : [...prev, record]
        })
      })
      .catch(() => {})
  })

  const handleStatusChange = async (lead: Lead, newStatus: Lead['status']) => {
    if (lead.status === newStatus) return

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)))

    try {
      await updateLead(lead.id, { status: newStatus })
    } catch (e) {
      loadData()
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const filteredLeads = leads.filter((lead) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const nome = lead.nome?.toLowerCase() || ''
      const contato = lead.contato_nome?.toLowerCase() || ''
      const nomeFantasia = (lead as any).expand?.cliente_id?.nome_fantasia?.toLowerCase() || ''
      const clienteNome = (lead as any).expand?.cliente_id?.nome?.toLowerCase() || ''
      if (
        !nome.includes(term) &&
        !contato.includes(term) &&
        !nomeFantasia.includes(term) &&
        !clienteNome.includes(term)
      ) {
        return false
      }
    }
    return true
  })
  let totalLeads = filteredLeads.length
  let leadsNovosMes = 0
  let leadsConvertidos = 0

  filteredLeads.forEach((lead) => {
    if (lead.status === 'Convertido') leadsConvertidos++
    const createdDate = new Date(lead.created)
    if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
      leadsNovosMes++
    }
  })

  const taxaConversao = totalLeads ? Math.round((leadsConvertidos / totalLeads) * 100) : 0

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (filteredLeads.length === 0) {
      toast({
        title: 'Não há dados para exportar.',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    const { id } = toast({
      title: 'Gerando exportação...',
      description: 'Aguarde enquanto preparamos o seu arquivo.',
    })

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/spreadsheet/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({ source: 'leads', ids: filteredLeads.map((l) => l.id), format }),
        },
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'Falha na exportação')
      }

      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `export_leads_${dateStr}.${format}`

      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await res.json()
        if (data.base64 && data.type) {
          const link = document.createElement('a')
          link.href = `data:application/octet-stream;base64,${data.base64}`
          link.download = filename
          link.click()
          toast({
            id,
            title: 'Exportação concluída',
            description: `O arquivo ${filename} foi gerado com sucesso.`,
          })
          setIsExporting(false)
          return
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        id,
        title: 'Exportação concluída',
        description: `O arquivo ${filename} foi gerado com sucesso.`,
      })
    } catch (error: any) {
      toast({
        id,
        title: 'Erro ao exportar',
        description: error.message || 'Não foi possível exportar os dados. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return
    try {
      await deleteLead(leadToDelete.id)
      toast({ title: 'Lead excluído com sucesso' })
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao excluir lead', variant: 'destructive' })
    } finally {
      setLeadToDelete(null)
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Prospecção
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie leads em fase inicial e cadência de contatos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar empresa ou negócio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white focus-visible:ring-[#F97316] focus-visible:border-[#F97316] border-gray-200 shadow-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={filteredLeads.length === 0 || isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isExporting}>
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar
          </Button>

          <Button
            className="bg-[#F97316] hover:bg-[#EA580C] text-white"
            onClick={() => {
              setLeadToEdit(null)
              setIsNewLeadOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 px-1">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Total de Leads</p>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Leads Novos (Mês)</p>
          <p className="text-2xl font-bold text-blue-600">{leadsNovosMes}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Leads Convertidos</p>
          <p className="text-2xl font-bold text-emerald-600">{leadsConvertidos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-purple-600">{taxaConversao}%</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <LeadsKanbanBoard
          leads={filteredLeads}
          onStatusChange={handleStatusChange}
          onConvertLead={(lead) => {
            if (lead.cliente_id) {
              toast({
                title: 'Ação não permitida',
                description: 'Este lead já foi convertido e está vinculado a um cliente.',
                variant: 'destructive',
              })
              return
            }
            setConvertingLead(lead)
          }}
          onEditLead={(lead) => {
            setLeadToEdit(lead)
            setIsNewLeadOpen(true)
          }}
          onDeleteLead={(lead) => setLeadToDelete(lead)}
        />
      </div>

      <LeadFormSheet
        open={isNewLeadOpen}
        onOpenChange={(o) => {
          setIsNewLeadOpen(o)
          if (!o) setLeadToEdit(null)
        }}
        onSuccess={loadData}
        leadToEdit={leadToEdit}
      />

      <LeadImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onSuccess={loadData} />

      <AlertDialog open={!!leadToDelete} onOpenChange={(o) => !o && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome}</strong>? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {convertingLead && (
        <LeadConvertModal
          lead={convertingLead}
          open={!!convertingLead}
          onOpenChange={(v) => !v && setConvertingLead(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

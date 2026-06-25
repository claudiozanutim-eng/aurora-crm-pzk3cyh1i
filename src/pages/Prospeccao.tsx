import { useEffect, useState } from 'react'
import { LeadsKanbanBoard } from '@/components/prospeccao/LeadsKanbanBoard'
import { LeadFormSheet } from '@/components/prospeccao/LeadFormSheet'
import { LeadConvertModal } from '@/components/prospeccao/LeadConvertModal'
import { LeadImportDialog } from '@/components/prospeccao/LeadImportDialog'
import { getLeads, Lead, updateLead, deleteLead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
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
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [convertedClientNames, setConvertedClientNames] = useState<Set<string>>(new Set())

  const loadData = async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadClients = async () => {
    try {
      const clients = await pb.collection('clientes').getFullList({ fields: 'nome' })
      setConvertedClientNames(new Set(clients.map((c) => c.nome)))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    loadClients()
  }, [])

  useRealtime('leads', () => {
    loadData()
  })

  useRealtime('clientes', () => {
    loadClients()
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

  let totalLeads = leads.length
  let leadsNovosMes = 0
  let leadsConvertidos = 0

  leads.forEach((lead) => {
    if (lead.status === 'Convertido') leadsConvertidos++
    const createdDate = new Date(lead.created)
    if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
      leadsNovosMes++
    }
  })

  const taxaConversao = totalLeads ? Math.round((leadsConvertidos / totalLeads) * 100) : 0

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (leads.length === 0) {
      toast({
        title: 'Não há dados para exportar.',
        variant: 'destructive',
      })
      return
    }

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
          body: JSON.stringify({ source: 'leads', ids: leads.map((l) => l.id), format }),
        },
      )

      if (!res.ok) throw new Error('Falha na exportação')

      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await res.json()
        if (data.file && data.filename) {
          const link = document.createElement('a')
          link.href = `data:application/octet-stream;base64,${data.file}`
          link.download = data.filename
          link.click()
          toast({
            id,
            title: 'Exportação concluída',
            description: `O arquivo ${data.filename} foi gerado com sucesso.`,
          })
          return
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads.${format}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        id,
        title: 'Exportação concluída',
        description: `O arquivo leads.${format} foi gerado com sucesso.`,
      })
    } catch (error) {
      toast({
        id,
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os dados. Tente novamente.',
        variant: 'destructive',
      })
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={leads.length === 0}>
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>Exportar CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
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
          leads={leads}
          onStatusChange={handleStatusChange}
          onConvertLead={setConvertingLead}
          onEditLead={(lead) => {
            setLeadToEdit(lead)
            setIsNewLeadOpen(true)
          }}
          onDeleteLead={(lead) => setLeadToDelete(lead)}
          convertedClientNames={convertedClientNames}
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

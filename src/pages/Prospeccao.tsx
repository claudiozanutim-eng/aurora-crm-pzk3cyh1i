import { useEffect, useState } from 'react'
import { LeadsKanbanBoard } from '@/components/prospeccao/LeadsKanbanBoard'
import { LeadFormSheet } from '@/components/prospeccao/LeadFormSheet'
import { LeadConvertModal } from '@/components/prospeccao/LeadConvertModal'
import { getLeads, Lead, updateLead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Prospeccao() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)

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

  useRealtime('leads', () => {
    loadData()
  })

  const handleStatusChange = async (lead: Lead, newStatus: Lead['status']) => {
    if (lead.status === newStatus) return

    if (newStatus === 'Convertido') {
      setConvertingLead(lead)
      return
    }

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
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#F97316] hover:bg-[#EA580C] text-white"
            onClick={() => setIsNewLeadOpen(true)}
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
        <LeadsKanbanBoard leads={leads} onStatusChange={handleStatusChange} />
      </div>

      <LeadFormSheet open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} onSuccess={loadData} />

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

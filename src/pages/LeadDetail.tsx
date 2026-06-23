import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLeadById, Lead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LeadDataForm } from '@/components/details/LeadDataForm'
import { LeadContactsTab } from '@/components/details/LeadContactsTab'
import { InteractionsTimeline } from '@/components/details/InteractionsTimeline'
import { TasksList } from '@/components/details/TasksList'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)

  const load = async () => {
    if (!id) return
    try {
      const data = await getLeadById(id)
      setLead(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [id])
  useRealtime('leads', load)

  if (!lead)
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        Carregando detalhes do lead...
      </div>
    )

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {lead.nome}
          </h1>
          <p className="text-gray-500 mt-1">Detalhes e gestão completa do lead.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 p-6">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-12 pb-0 overflow-x-auto mb-6 gap-6">
            <TabsTrigger
              value="dados"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Lead
            </TabsTrigger>
            <TabsTrigger
              value="contatos"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Contatos
            </TabsTrigger>
            <TabsTrigger
              value="interacoes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Histórico de Interações
            </TabsTrigger>
            <TabsTrigger
              value="tarefas"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Tarefas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="focus-visible:outline-none">
            <LeadDataForm lead={lead} />
          </TabsContent>
          <TabsContent value="contatos" className="focus-visible:outline-none">
            <LeadContactsTab lead={lead} />
          </TabsContent>
          <TabsContent value="interacoes" className="focus-visible:outline-none">
            <InteractionsTimeline targetId={lead.id} targetType="lead" />
          </TabsContent>
          <TabsContent value="tarefas" className="focus-visible:outline-none">
            <TasksList targetId={lead.id} targetType="lead" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

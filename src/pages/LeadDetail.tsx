import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getLeadById, Lead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useAuro } from '@/hooks/use-auro'
import { LeadDataForm, LeadDataFormRef } from '@/components/details/LeadDataForm'
import { AuroAvatar } from '@/components/auro/AuroAvatar'
import { LeadContactsTab } from '@/components/details/LeadContactsTab'
import { InteractionsTimeline } from '@/components/details/InteractionsTimeline'
import { TasksList } from '@/components/details/TasksList'
import { TagBadge } from '@/components/ui/tag-badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/funil'
  const [lead, setLead] = useState<Lead | null>(null)
  const formRef = useRef<LeadDataFormRef>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleBack = () => {
    if (formRef.current?.isDirty) {
      setShowUnsavedDialog(true)
    } else {
      navigate(from)
    }
  }

  const handleSaveAndExit = async () => {
    if (formRef.current) {
      setIsSaving(true)
      const success = await formRef.current.saveChanges()
      setIsSaving(false)
      if (success) {
        setShowUnsavedDialog(false)
        navigate(from)
      }
    }
  }

  const handleExitWithoutSaving = () => {
    setShowUnsavedDialog(false)
    navigate(from)
  }

  const { triggerAnalysis } = useAuro()

  const handleAnalyze = () => {
    triggerAnalysis('lead', id!, lead?.nome || '')
  }

  if (!lead)
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        Carregando detalhes do lead...
      </div>
    )

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} className="gap-2 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleAnalyze}
          className="hover:bg-[#cc4a1c] hover:text-white gap-2.5 h-11 px-5 text-[#4A4A4A] bg-[#ffffff] shadow-[0px_0px_6px_0px_#e55320] font-semibold transition-colors duration-200 group"
        >
          <AuroAvatar className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold text-sm">Analisar com Auro</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 shrink-0" />
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {lead.nome}
            </h1>
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {lead.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-1">Detalhes e gestão completa do lead.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 p-6">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-12 pb-0 overflow-x-auto mb-6 gap-6">
            <TabsTrigger
              value="dados"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Lead
            </TabsTrigger>
            <TabsTrigger
              value="contatos"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Contatos
            </TabsTrigger>
            <TabsTrigger
              value="interacoes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Histórico de Interações
            </TabsTrigger>
            <TabsTrigger
              value="tarefas"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Tarefas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="focus-visible:outline-none">
            <LeadDataForm ref={formRef} lead={lead} onExit={() => navigate(from)} />
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

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você possui alterações não salvas. Deseja salvar antes de sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleExitWithoutSaving} disabled={isSaving}>
              Sair sem Salvar
            </Button>
            <Button
              onClick={handleSaveAndExit}
              disabled={isSaving}
              className="bg-[#e55320] hover:bg-[#cc4a1c] text-white"
            >
              {isSaving ? 'Salvando...' : 'Salvar e Sair'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getClienteById, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, X, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { useAuro } from '@/hooks/use-auro'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { ClientDataForm, ClientDataFormRef } from '@/components/details/ClientDataForm'
import { AuroAvatar } from '@/components/auro/AuroAvatar'
import { NegocioDataForm, NegocioDataFormRef } from '@/components/details/NegocioDataForm'
import { ContactsList } from '@/components/details/ContactsList'
import { InteractionsTimeline } from '@/components/details/InteractionsTimeline'
import { TasksList } from '@/components/details/TasksList'
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

export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const formRef = useRef<ClientDataFormRef>(null)
  const negocioFormRef = useRef<NegocioDataFormRef>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')

  const { triggerAnalysis } = useAuro()

  const handleAnalyze = () => {
    triggerAnalysis('cliente', id!, cliente?.nome || '')
  }

  const load = async () => {
    if (!id) return
    try {
      const data = await getClienteById(id)
      setCliente(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [id])
  useRealtime('clientes', load)

  if (!cliente)
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        Carregando detalhes do cliente...
      </div>
    )

  const from = location.state?.from || '/funil'

  const handleBack = () => {
    if (formRef.current?.isDirty || negocioFormRef.current?.isDirty) {
      setShowUnsavedDialog(true)
    } else {
      navigate(from)
    }
  }

  const handleSaveAndExit = async () => {
    setIsSaving(true)
    let success = true
    if (formRef.current?.isDirty) {
      success = (await formRef.current.saveChanges()) && success
    }
    if (negocioFormRef.current?.isDirty) {
      success = (await negocioFormRef.current.saveChanges()) && success
    }
    setIsSaving(false)
    if (success) {
      setShowUnsavedDialog(false)
      navigate(from)
    }
  }

  const handleExitWithoutSaving = () => {
    setShowUnsavedDialog(false)
    navigate(from)
  }

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
        {/* Placeholder to keep alignment for the title block */}
        <div className="w-10 shrink-0" />
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {cliente.nome}
            </h1>
            {cliente.tags && cliente.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {cliente.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-1">Detalhes e gestão completa do cliente.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-12 pb-0 overflow-x-auto mb-6 gap-6">
            <TabsTrigger
              value="dados"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Cliente
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
            <TabsTrigger
              value="negocios"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#e55320] data-[state=active]:text-[#e55320] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Negócio
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="dados"
            forceMount
            hidden={activeTab !== 'dados'}
            className={`focus-visible:outline-none ${activeTab !== 'dados' ? 'hidden' : ''}`}
          >
            <ClientDataForm ref={formRef} cliente={cliente} onExit={() => navigate(from)} />
          </TabsContent>
          <TabsContent
            value="contatos"
            forceMount
            hidden={activeTab !== 'contatos'}
            className={`focus-visible:outline-none ${activeTab !== 'contatos' ? 'hidden' : ''}`}
          >
            <ContactsList clienteId={cliente.id} />
          </TabsContent>
          <TabsContent
            value="interacoes"
            forceMount
            hidden={activeTab !== 'interacoes'}
            className={`focus-visible:outline-none ${activeTab !== 'interacoes' ? 'hidden' : ''}`}
          >
            <InteractionsTimeline targetId={cliente.id} targetType="cliente" />
          </TabsContent>
          <TabsContent
            value="tarefas"
            forceMount
            hidden={activeTab !== 'tarefas'}
            className={`focus-visible:outline-none ${activeTab !== 'tarefas' ? 'hidden' : ''}`}
          >
            <TasksList targetId={cliente.id} targetType="cliente" />
          </TabsContent>
          <TabsContent
            value="negocios"
            forceMount
            hidden={activeTab !== 'negocios'}
            className={`focus-visible:outline-none ${activeTab !== 'negocios' ? 'hidden' : ''}`}
          >
            <NegocioDataForm
              ref={negocioFormRef}
              clienteId={cliente.id}
              onExit={() => navigate(from)}
            />
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

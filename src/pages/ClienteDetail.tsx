import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClienteById, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ClientDataForm, ClientDataFormRef } from '@/components/details/ClientDataForm'
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
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const formRef = useRef<ClientDataFormRef>(null)
  const negocioFormRef = useRef<NegocioDataFormRef>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleBack = () => {
    if (formRef.current?.isDirty || negocioFormRef.current?.isDirty) {
      setShowUnsavedDialog(true)
    } else {
      navigate('/funil')
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
      navigate('/funil')
    }
  }

  const handleExitWithoutSaving = () => {
    setShowUnsavedDialog(false)
    navigate('/funil')
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
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
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-12 pb-0 overflow-x-auto mb-6 gap-6">
            <TabsTrigger
              value="dados"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Cliente
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
            <TabsTrigger
              value="negocios"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B00] data-[state=active]:text-[#FF6B00] data-[state=active]:shadow-none rounded-none bg-transparent px-1 pb-3 text-base"
            >
              Dados do Negócio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="focus-visible:outline-none">
            <ClientDataForm
              ref={formRef}
              cliente={cliente}
              onExit={() => navigate(`/clientes/${cliente.id}`)}
            />
          </TabsContent>
          <TabsContent value="contatos" className="focus-visible:outline-none">
            <ContactsList clienteId={cliente.id} />
          </TabsContent>
          <TabsContent value="interacoes" className="focus-visible:outline-none">
            <InteractionsTimeline targetId={cliente.id} targetType="cliente" />
          </TabsContent>
          <TabsContent value="tarefas" className="focus-visible:outline-none">
            <TasksList targetId={cliente.id} targetType="cliente" />
          </TabsContent>
          <TabsContent value="negocios" className="focus-visible:outline-none">
            <NegocioDataForm
              ref={negocioFormRef}
              clienteId={cliente.id}
              onExit={() => navigate(`/clientes/${cliente.id}`)}
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
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
            >
              {isSaving ? 'Salvando...' : 'Salvar e Sair'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

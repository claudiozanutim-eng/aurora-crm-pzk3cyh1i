import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getClienteById, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, X, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { streamAgentChat } from '@/lib/skipAi'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
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
  const location = useLocation()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const formRef = useRef<ClientDataFormRef>(null)
  const negocioFormRef = useRef<NegocioDataFormRef>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisContent, setAnalysisContent] = useState('')
  const [emailCopied, setEmailCopied] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleAnalyze = async () => {
    if (isAnalyzing) return
    setIsAnalysisOpen(true)
    setIsAnalyzing(true)
    setAnalysisContent('')

    abortControllerRef.current = new AbortController()
    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/analise-comercial`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({ cliente_id: id }),
          signal: abortControllerRef.current.signal,
        },
      )

      await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setAnalysisContent(full)
        },
        signal: abortControllerRef.current.signal,
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || 'Erro ao analisar cliente')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text)
    setEmailCopied(true)
    toast.success('E-mail copiado para a área de transferência')
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const formatText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const renderAnalysis = (text: string) => {
    if (!text.includes('###')) {
      return <div className="whitespace-pre-wrap text-sm text-gray-700">{text}</div>
    }

    const sections = text.split('###').filter((s) => s.trim().length > 0)

    return sections.map((section, idx) => {
      const lines = section.trim().split('\n')
      const title = lines[0].trim()
      const body = lines.slice(1).join('\n').trim()

      const isEmail =
        title.toLowerCase().includes('e-mail') || title.toLowerCase().includes('email')

      return (
        <div key={idx} className="mb-6 last:mb-0">
          <h4 className="text-base font-semibold text-gray-900 mb-2">{title}</h4>

          {isEmail ? (
            <div className="relative bg-white border border-gray-200 rounded-md p-4 pt-10">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-8"
                onClick={() => handleCopyEmail(body)}
              >
                {emailCopied ? (
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {emailCopied ? 'Copiado!' : 'Copiar'}
              </Button>
              <div className="whitespace-pre-wrap text-sm text-gray-700">{body}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 space-y-1">
              {body.split('\n').map((line, i) => {
                const trimmed = line.trim()
                if (!trimmed) return null
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <li key={i} className="ml-4 list-disc marker:text-gray-400">
                      {formatText(trimmed.substring(2))}
                    </li>
                  )
                }
                return (
                  <p key={i} className="mb-2">
                    {formatText(trimmed)}
                  </p>
                )
              })}
            </div>
          )}
        </div>
      )
    })
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
          disabled={isAnalyzing}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-sm"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Analisar Cliente
        </Button>
      </div>

      {isAnalysisOpen && (
        <div className="bg-gray-50 border border-orange-200 rounded-lg p-5 relative shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAnalysisOpen(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Análise Comercial (IA)
          </h3>

          <div className="max-w-none">{renderAnalysis(analysisContent)}</div>

          {isAnalyzing && (
            <div className="flex items-center gap-2 mt-4 text-orange-600 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando insights...
            </div>
          )}
        </div>
      )}

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
            <ClientDataForm ref={formRef} cliente={cliente} onExit={() => navigate(from)} />
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

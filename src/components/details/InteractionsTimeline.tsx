import { useEffect, useState } from 'react'
import {
  getInteracoes,
  createInteracao,
  updateInteracao,
  deleteInteracao,
  Interacao,
} from '@/services/interacoes'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
import {
  Mail,
  MessageCircle,
  Phone,
  Users,
  FileText,
  Send,
  Plus,
  ArrowRightLeft,
  CheckCircle,
  Upload,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

const icons: Record<string, any> = {
  'E-mail': <Mail className="w-4 h-4 text-blue-500" />,
  WhatsApp: <MessageCircle className="w-4 h-4 text-green-500" />,
  Telefonema: <Phone className="w-4 h-4 text-purple-500" />,
  Reunião: <Users className="w-4 h-4 text-orange-500" />,
  'Proposta Enviada': <FileText className="w-4 h-4 text-red-500" />,
  'Enviar Proposta': <Send className="w-4 h-4 text-indigo-500" />,
  'Movimentação de Funil': <ArrowRightLeft className="w-4 h-4 text-[#e55320]" />,
  'Proposta Aprovada': <CheckCircle className="w-4 h-4 text-green-500" />,
}

const editableTipos = [
  'E-mail',
  'WhatsApp',
  'Telefonema',
  'Reunião',
  'Proposta Enviada',
  'Enviar Proposta',
  'Proposta Aprovada',
]

function toDatetimeLocal(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InteractionsTimeline({
  targetId,
  targetType,
}: {
  targetId: string
  targetType: 'cliente' | 'lead'
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [open, setOpen] = useState(false)

  const [tipo, setTipo] = useState<Interacao['tipo']>('Telefonema')
  const [dataHora, setDataHora] = useState('')
  const [resumo, setResumo] = useState('')

  const [externalDialogOpen, setExternalDialogOpen] = useState(false)
  const [extTitle, setExtTitle] = useState('')
  const [extValue, setExtValue] = useState('')
  const [extFile, setExtFile] = useState<File | null>(null)
  const [extNegocio, setExtNegocio] = useState('')
  const [clientNegocios, setClientNegocios] = useState<any[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editingInteracao, setEditingInteracao] = useState<Interacao | null>(null)
  const [editTipo, setEditTipo] = useState<Interacao['tipo']>('Telefonema')
  const [editDataHora, setEditDataHora] = useState('')
  const [editResumo, setEditResumo] = useState('')
  const [editObservacoes, setEditObservacoes] = useState('')
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({})

  const [deleteTarget, setDeleteTarget] = useState<Interacao | null>(null)

  useEffect(() => {
    if (targetType === 'cliente' && externalDialogOpen) {
      pb.collection('negocios')
        .getFullList({ filter: `cliente_id="${targetId}"` })
        .then(setClientNegocios)
        .catch(console.error)
    }
  }, [targetId, targetType, externalDialogOpen])

  const handleExternalProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extFile) return toast({ title: 'Selecione um arquivo', variant: 'destructive' })
    if (!extNegocio) return toast({ title: 'Selecione um negócio', variant: 'destructive' })

    try {
      const formData = new FormData()
      formData.append('titulo', extTitle)
      formData.append('valor_total', extValue)
      formData.append('cliente_id', targetId)
      formData.append('status', 'Aprovada')
      formData.append('negocio_id', extNegocio)
      formData.append('arquivo_aprovado', extFile)

      formData.append('descricao_servicos', 'Proposta externa anexada')
      formData.append('condicoes_comerciais', 'Vide documento anexo')
      formData.append('validade_dias', '30')

      const p = await pb.collection('propostas').create(formData)
      const fileUrl = pb.files.getUrl(p, p.arquivo_aprovado)

      await pb.collection('interacoes').create({
        tipo: 'Proposta Aprovada',
        data_hora: new Date().toISOString(),
        resumo: `Proposta externa "${extTitle}" anexada por ${user?.name || user?.email}.`,
        observacoes: fileUrl,
        vendedor_id: user.id,
        cliente_id: targetId,
      })

      toast({ title: 'Proposta externa anexada com sucesso.' })
      setExternalDialogOpen(false)
      setExtTitle('')
      setExtValue('')
      setExtFile(null)
      setExtNegocio('')
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Erro ao anexar proposta', variant: 'destructive' })
    }
  }

  const buildUrlWithToken = (rawUrl: string, download: boolean = false) => {
    const baseUrl = rawUrl.startsWith('http')
      ? rawUrl
      : import.meta.env.VITE_POCKETBASE_URL + (rawUrl.startsWith('/') ? '' : '/') + rawUrl
    try {
      const url = new URL(baseUrl)
      if (download) {
        url.searchParams.set('download', '1')
      } else {
        url.searchParams.delete('download')
      }
      if (pb.authStore.token) {
        url.searchParams.set('token', pb.authStore.token)
      }
      return url.toString()
    } catch {
      return rawUrl
    }
  }

  const getFileUrlInfo = (obs?: string) => {
    if (!obs) return null
    try {
      const url = new URL(obs)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
      return {
        viewUrl: buildUrlWithToken(url.toString(), false),
        downloadUrl: buildUrlWithToken(url.toString(), true),
      }
    } catch {
      return null
    }
  }

  const load = async () => {
    try {
      const data = await getInteracoes(targetId, targetType)
      setInteracoes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [targetId])
  useRealtime('interacoes', load)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createInteracao({
        tipo,
        data_hora: new Date(dataHora).toISOString(),
        resumo,
        vendedor_id: user.id,
        ...(targetType === 'cliente' ? { cliente_id: targetId } : { lead_id: targetId }),
      })
      toast({ title: 'Interação registrada.' })
      setOpen(false)
      setResumo('')
      setDataHora('')
    } catch (err) {
      toast({ title: 'Erro ao registrar', variant: 'destructive' })
    }
  }

  const openEdit = (interacao: Interacao) => {
    setEditingInteracao(interacao)
    setEditTipo(interacao.tipo)
    setEditDataHora(toDatetimeLocal(interacao.data_hora))
    setEditResumo(interacao.resumo || '')
    setEditObservacoes(interacao.observacoes || '')
    setEditFieldErrors({})
    setEditOpen(true)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInteracao) return
    setEditFieldErrors({})
    try {
      await updateInteracao(editingInteracao.id, {
        tipo: editTipo,
        resumo: editResumo,
        observacoes: editObservacoes,
        data_hora: new Date(editDataHora).toISOString(),
      })
      toast({ title: 'Interação atualizada.' })
      setEditOpen(false)
      setEditingInteracao(null)
    } catch (err) {
      setEditFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao atualizar interação', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteInteracao(deleteTarget.id)
      toast({ title: 'Interação excluída.' })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Erro ao excluir interação', variant: 'destructive' })
    }
  }

  const isEditable = (i: Interacao) => i.tipo !== 'Movimentação de Funil'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Histórico de Interações</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          {targetType === 'cliente' && (
            <Dialog open={externalDialogOpen} onOpenChange={setExternalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#e55320] hover:bg-[#cc4a1c] text-white">
                  <Upload className="w-4 h-4 mr-2" /> Anexar Proposta Aprovada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Anexar Proposta Externa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleExternalProposal} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Título</label>
                    <Input
                      placeholder="Título da Proposta"
                      value={extTitle}
                      onChange={(e) => setExtTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5000.00"
                      value={extValue}
                      onChange={(e) => setExtValue(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Negócio Associado</label>
                    <Select value={extNegocio} onValueChange={setExtNegocio} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um Negócio" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientNegocios.length > 0 ? (
                          clientNegocios.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.descricao || `Negócio #${n.id.slice(0, 5)}`} -{' '}
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(n.valor_estimado || 0)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum negócio cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Arquivo Assinado</label>
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setExtFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#e55320] hover:bg-[#cc4a1c] text-white"
                  >
                    Salvar Proposta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#e55320] hover:bg-[#cc4a1c] text-white">
                <Plus className="w-4 h-4 mr-2" /> Nova Interação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Interação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableTipos.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Resumo da interação..."
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  required
                  rows={4}
                />
                <Button type="submit" className="w-full bg-[#e55320] hover:bg-[#cc4a1c] text-white">
                  Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 mt-4">
        {interacoes.map((i) => (
          <div key={i.id} className="relative">
            <div className="absolute -left-[35px] bg-white p-2 rounded-full border-2 border-gray-100 shadow-sm flex items-center justify-center">
              {icons[i.tipo]}
            </div>
            <div
              className={cn(
                'rounded-lg p-4 shadow-sm border',
                i.tipo === 'Movimentação de Funil'
                  ? 'bg-white border-orange-200 ring-1 ring-orange-50'
                  : 'bg-gray-50 border-gray-100',
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={cn(
                    'font-semibold',
                    i.tipo === 'Movimentação de Funil' ? 'text-orange-600' : 'text-gray-800',
                  )}
                >
                  {i.tipo}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(i.data_hora).toLocaleString('pt-BR')}
                  </span>
                  {isEditable(i) && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-[#e55320] hover:bg-orange-50"
                        onClick={() => openEdit(i)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteTarget(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  i.tipo === 'Movimentação de Funil' ? 'text-black font-medium' : 'text-gray-700',
                )}
              >
                {i.resumo}
              </p>
              {i.observacoes && i.tipo !== 'Proposta Aprovada' && (
                <p className="text-xs text-gray-500 mt-2 italic">{i.observacoes}</p>
              )}
              {i.tipo === 'Proposta Aprovada' && (
                <div className="flex gap-2 mt-3 items-center">
                  {(() => {
                    const baseInfo = getFileUrlInfo(i.observacoes)
                    if (!baseInfo) {
                      return (
                        <span className="text-sm text-gray-500 italic">
                          {i.observacoes ? 'Arquivo não disponível' : 'Nenhum arquivo anexado'}
                        </span>
                      )
                    }

                    let downloadUrl = baseInfo.downloadUrl

                    try {
                      let baseUrlString = baseInfo.downloadUrl || baseInfo.viewUrl
                      let url: URL
                      if (baseUrlString.startsWith('http')) {
                        url = new URL(baseUrlString)
                      } else {
                        url = new URL(
                          baseUrlString,
                          import.meta.env.VITE_POCKETBASE_URL || window.location.origin,
                        )
                      }

                      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}')
                      const token = authData?.token || ''

                      if (token) {
                        url.searchParams.set('token', token)
                      }

                      url.searchParams.set('download', '1')
                      downloadUrl = url.toString()
                    } catch (e) {
                      console.error('Error formatting file URL', e)
                    }

                    const handleDownloadClick = async () => {
                      try {
                        const res = await fetch(downloadUrl, { method: 'HEAD' })
                        if (!res.ok) {
                          toast({
                            title: 'Arquivo indisponível',
                            description: 'Não foi possível acessar o arquivo no momento.',
                            variant: 'destructive',
                          })
                        }
                      } catch (error) {
                        toast({
                          title: 'Erro de conexão',
                          description: 'Verifique sua conexão e tente novamente.',
                          variant: 'destructive',
                        })
                      }
                    }

                    const finalDownloadUrl = downloadUrl.includes('?')
                      ? `${downloadUrl}&download=1`
                      : `${downloadUrl}?download=1`

                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-green-700 border-green-200 bg-green-50 hover:bg-green-100 transition-all"
                      >
                        <a
                          href={finalDownloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          onClick={handleDownloadClick}
                        >
                          <Download className="w-4 h-4 mr-2" /> Baixar Arquivo
                        </a>
                      </Button>
                    )
                  })()}
                </div>
              )}
              <p
                className={cn(
                  'text-xs mt-3 pt-3 border-t',
                  i.tipo === 'Movimentação de Funil'
                    ? 'text-gray-500 border-orange-100'
                    : 'text-gray-400 border-gray-200',
                )}
              >
                Por: {i.expand?.vendedor_id?.name || 'Usuário Desconhecido'}
              </p>
            </div>
          </div>
        ))}
        {interacoes.length === 0 && (
          <p className="text-gray-500 text-sm italic">Nenhuma interação registrada.</p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Interação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={editTipo} onValueChange={(v: any) => setEditTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {editableTipos.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data e Hora</label>
              <Input
                type="datetime-local"
                value={editDataHora}
                onChange={(e) => setEditDataHora(e.target.value)}
                required
              />
              {editFieldErrors.data_hora && (
                <p className="text-sm text-red-500">{editFieldErrors.data_hora}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Resumo</label>
              <Textarea
                value={editResumo}
                onChange={(e) => setEditResumo(e.target.value)}
                required
                rows={4}
              />
              {editFieldErrors.resumo && (
                <p className="text-sm text-red-500">{editFieldErrors.resumo}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={editObservacoes}
                onChange={(e) => setEditObservacoes(e.target.value)}
                rows={3}
              />
              {editFieldErrors.observacoes && (
                <p className="text-sm text-red-500">{editFieldErrors.observacoes}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#e55320] hover:bg-[#cc4a1c] text-white">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Interação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

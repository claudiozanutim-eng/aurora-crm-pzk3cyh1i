import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, CheckCircle, Upload, Eye, Trash } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export default function PropostaView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposta, setProposta] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [negocio, setNegocio] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return
        const p = await pb.collection('propostas').getOne(id)
        setProposta(p)

        if (p.cliente_id) {
          try {
            const c = await pb.collection('clientes').getOne(p.cliente_id)
            setCliente(c)
          } catch {
            /* intentionally ignored */
          }
        }

        if (p.negocio_id) {
          try {
            const n = await pb.collection('negocios').getOne(p.negocio_id, {
              expand: 'vendedor_id',
            })
            setNegocio(n)
            if (n.expand?.vendedor_id) {
              setVendedor(n.expand.vendedor_id)
            }
          } catch {
            /* intentionally ignored */
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleGerarPDF = async () => {
    if (!id) return
    try {
      setDownloading(true)
      const response = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/proposta/pdf/${id}`,
        {
          headers: {
            Authorization: pb.authStore.token,
          },
        },
      )

      if (!response.ok) {
        let errorMsg = 'Falha ao gerar o documento'
        try {
          const errData = await response.json()
          if (errData.message) errorMsg = errData.message
          else if (errData.error) errorMsg = errData.error
        } catch {
          /* intentionally ignored */
        }
        throw new Error(errorMsg)
      }

      const blob = await response.blob()

      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `Proposta_${proposta.id.substring(0, 8).toUpperCase()}.pdf`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1]
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF gerado e baixado com sucesso.')
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      toast.error(error.message || 'Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('arquivo_aprovado', file)
      formData.append('status', 'Aprovada')

      const updated = await pb.collection('propostas').update(id, formData)
      setProposta(updated)

      const fileUrl = pb.files.getUrl(updated, updated.arquivo_aprovado)

      await pb.collection('interacoes').create({
        tipo: 'Proposta Aprovada',
        data_hora: new Date().toISOString(),
        resumo: `Proposta "${updated.titulo}" aprovada e arquivo assinado anexado por ${user?.name || user?.email}.`,
        observacoes: fileUrl,
        vendedor_id: user?.id,
        cliente_id: updated.cliente_id,
      })
      toast.success('Arquivo enviado e proposta aprovada com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar arquivo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async () => {
    if (!id || !confirm('Deseja realmente excluir este arquivo?')) return
    try {
      setUploading(true)
      const updated = await pb.collection('propostas').update(id, { arquivo_aprovado: null })
      setProposta(updated)
      toast.success('Arquivo excluído com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir arquivo.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">Carregando proposta...</div>
    )
  }

  if (!proposta) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">Proposta não encontrada.</div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={handleGerarPDF}
          disabled={downloading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Gerar PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:m-0 print:p-0">
        <CardHeader className="text-center border-b pb-8 print:border-b-2 print:border-orange-500">
          <div className="flex justify-between items-start text-left mb-8">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">IC Educ</h1>
            </div>
            <div className="text-right text-sm text-muted-foreground print:text-black">
              <p>{vendedor?.email || user?.email}</p>
              <p>Data de emissão: {new Date(proposta.created).toLocaleDateString('pt-BR')}</p>
              <p>Ref: #{proposta.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="text-left mt-8">
            <h3 className="text-sm font-bold text-orange-500 mb-2">PREPARADO PARA</h3>
            <h2 className="text-2xl text-foreground print:text-black">
              {cliente?.nome || 'Cliente não informado'}
            </h2>
            {cliente?.documento && (
              <p className="text-muted-foreground mt-1 print:text-gray-800">
                {cliente.tipo === 'PJ' ? 'CNPJ: ' : 'CPF: '} {cliente.documento}
              </p>
            )}
            {negocio?.descricao && (
              <p className="text-muted-foreground mt-1 print:text-gray-800">
                Negócio: {negocio.descricao}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <h1 className="text-3xl font-bold text-orange-500 mb-8">{proposta.titulo}</h1>

          <div className="mb-12">
            <h3 className="text-xl font-bold text-orange-500 mb-4 pb-2 border-b border-orange-200">
              Escopo e Descrição dos Serviços
            </h3>
            <div className="whitespace-pre-wrap text-muted-foreground print:text-gray-800">
              {proposta.descricao_servicos}
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-xl font-bold text-orange-500 mb-4 pb-2 border-b border-orange-200">
              Investimento
            </h3>
            <div className="text-3xl text-foreground print:text-black">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                proposta.valor_total || 0,
              )}
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-xl font-bold text-orange-500 mb-4 pb-2 border-b border-orange-200">
              Condições Comerciais
            </h3>
            <div className="whitespace-pre-wrap text-muted-foreground print:text-gray-800">
              {proposta.condicoes_comerciais}
            </div>
          </div>

          <Separator className="my-8 print:border-orange-500 print:border-b-2 print:border-t-0" />

          <div className="text-center text-sm text-muted-foreground print:text-gray-800">
            <p className="mb-2">
              {proposta.validade_ate ? (
                <>
                  Proposta válida até{' '}
                  <span className="font-semibold">
                    {new Date(proposta.validade_ate).toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                    })}
                  </span>
                </>
              ) : (
                'Proposta válida até a data combinada'
              )}
            </p>
            <p>Agradecemos a oportunidade de apresentar esta proposta comercial.</p>
          </div>
        </CardContent>
      </Card>

      {(proposta.status === 'Enviada' || proposta.status === 'Aprovada') && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 print:hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5" />
            Proposta Aprovada
          </h3>
          {proposta.arquivo_aprovado ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 gap-4">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{proposta.arquivo_aprovado}</span>
                <span className="text-sm text-gray-500">
                  Enviado em {new Date(proposta.updated).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() =>
                    window.open(pb.files.getUrl(proposta, proposta.arquivo_aprovado), '_blank')
                  }
                >
                  <Eye className="w-4 h-4 mr-2" /> Visualizar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={handleDeleteFile}
                  disabled={uploading}
                >
                  <Trash className="w-4 h-4 mr-2" /> Excluir
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Faça o upload do documento assinado (.pdf, .png, .jpg) para confirmar a aprovação
                formal da proposta.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleUpload}
              />
              <Button
                className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Fazer Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

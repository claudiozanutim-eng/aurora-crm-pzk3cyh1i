import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function PropostaView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposta, setProposta] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [negocio, setNegocio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

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
            const n = await pb.collection('negocios').getOne(p.negocio_id)
            setNegocio(n)
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
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/propostas/${id}/pdf`,
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
        if (filenameMatch && filenameMatch.length === 2) {
          fileName = filenameMatch[1]
        }
      } else {
        const clientName = cliente?.nome || 'Cliente'
        const safeClientName = clientName.replace(/[^a-zA-Z0-9À-ÿ -]/g, '').trim()
        const now = new Date()
        const months = [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ]
        fileName = `Proposta ${safeClientName} ${months[now.getMonth()]} ${now.getFullYear()}.pdf`
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
          {downloading ? 'Gerando...' : 'Gerar PDF'}
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:m-0 print:p-0">
        <CardHeader className="text-center border-b pb-8 print:border-b-2 print:border-orange-500">
          <div className="flex justify-between items-start text-left mb-8">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">IC Educ</h1>
            </div>
            <div className="text-right text-sm text-muted-foreground print:text-black">
              <p>contato@iceduc.com.br</p>
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
              Validade desta proposta:{' '}
              <span className="font-semibold">{proposta.validade_dias} dias</span> a partir da data
              de envio.
            </p>
            <p>Agradecemos a oportunidade de apresentar esta proposta comercial.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

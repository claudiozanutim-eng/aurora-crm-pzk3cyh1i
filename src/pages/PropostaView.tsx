import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPropostaById, type Proposta } from '@/services/propostas'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import auroraLogo from '@/assets/image69debc47-caaa-4a34-9b6b-8da340b6c9e7-53707.png'
import { toast } from 'sonner'

export default function PropostaView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!id) return
    getPropostaById(id)
      .then(setProposta)
      .catch(() => toast.error('Erro ao carregar proposta.'))
  }, [id])

  const handleDownloadPdf = async () => {
    if (!proposta) return
    setIsDownloading(true)
    try {
      const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/propostas/${proposta.id}/pdf`

      const res = await fetch(url, {
        headers: {
          Authorization: pb.authStore.token,
        },
      })

      if (!res.ok) throw new Error('Falha ao gerar o PDF')

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `Proposta-${proposta.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success('PDF baixado com sucesso!')
    } catch (error) {
      toast.error('Erro ao baixar o PDF. Tente novamente mais tarde.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!proposta) {
    return <div className="p-8 text-center text-gray-500">Carregando proposta...</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-4 px-4 sm:px-0 print:max-w-none print:w-full print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Printer className="mr-2 h-4 w-4" /> {isDownloading ? 'Gerando...' : 'Gerar PDF'}
        </Button>
      </div>

      <div className="bg-white p-8 sm:p-12 md:p-16 text-black shadow-xl print:shadow-none border border-gray-200 print:border-none rounded-xl print:rounded-none min-h-[1056px] print:p-0 print:m-0 w-full max-w-none">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-orange-500 pb-8 mb-10 gap-6">
          <div>
            <img
              src={auroraLogo}
              alt="IC Educ"
              className="h-16 md:h-20 object-contain print:h-20"
            />
          </div>
          <div className="text-left sm:text-right text-sm text-gray-600 space-y-1">
            <h2 className="font-bold text-gray-900 text-lg">IC Educ</h2>
            <p>contato@iceduc.com.br</p>
            <p>Data de emissão: {new Date(proposta.created).toLocaleDateString('pt-BR')}</p>
            <p>Ref: #{proposta.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <section className="mb-12 bg-gray-50 p-6 rounded-lg print:bg-transparent print:p-0 print:border-none border border-gray-100 print:break-inside-avoid">
          <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">
            Preparado para
          </h3>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {proposta.expand?.cliente_id?.nome}
          </h2>
          <p className="text-gray-600 mt-1">
            {proposta.expand?.cliente_id?.tipo === 'PJ' ? 'CNPJ: ' : 'CPF: '}
            {proposta.expand?.cliente_id?.documento || 'Não informado'}
          </p>
          {proposta.expand?.negocio_id && (
            <p className="text-gray-600 mt-1 text-sm font-medium">
              Negócio:{' '}
              {proposta.expand.negocio_id.descricao ||
                proposta.expand.negocio_id.id.substring(0, 8).toUpperCase()}
            </p>
          )}
        </section>

        <section className="mb-12 print:break-inside-avoid">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight print:text-orange-600">
            {proposta.titulo}
          </h1>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-orange-600 border-b-2 border-orange-100 pb-2 mb-4">
              Escopo e Descrição dos Serviços
            </h3>
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base print:text-black">
              {proposta.descricao_servicos}
            </div>
          </div>
        </section>

        <section className="mb-12 print:break-inside-avoid">
          <h3 className="text-xl font-bold text-orange-600 border-b-2 border-orange-100 pb-2 mb-4">
            Investimento
          </h3>
          <p className="text-3xl font-bold text-orange-600 print:text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              proposta.valor_total,
            )}
          </p>
        </section>

        <section className="mb-12 print:break-inside-avoid">
          <h3 className="text-xl font-bold text-orange-600 border-b-2 border-orange-100 pb-2 mb-4">
            Condições Comerciais
          </h3>
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base print:text-black">
            {proposta.condicoes_comerciais}
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t-2 border-orange-500 text-center text-sm text-gray-600 print:break-inside-avoid">
          <p>
            Validade desta proposta:{' '}
            <span className="font-bold text-orange-600">{proposta.validade_dias} dias</span> a
            partir da data de envio.
          </p>
          <p className="mt-2 text-gray-500">
            Agradecemos a oportunidade de apresentar esta proposta comercial.
          </p>
        </footer>
      </div>
    </div>
  )
}

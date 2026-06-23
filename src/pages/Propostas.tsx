import { proposalsData } from '@/data/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Download, Send, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  Enviada: 'bg-blue-100 text-blue-700',
  'Em Análise': 'bg-yellow-100 text-yellow-700',
  Aprovada: 'bg-green-100 text-green-700',
  Recusada: 'bg-red-100 text-red-700',
}

export default function Propostas() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Propostas Comerciais
          </h1>
          <p className="text-gray-500 mt-1">Gerencie documentos e cotações enviadas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Criar Proposta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {proposalsData.map((proposal) => (
          <Card key={proposal.id} className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{proposal.id}</h3>
                    <p className="text-sm text-gray-500">{proposal.date}</p>
                  </div>
                </div>
                <Badge className={`${statusColors[proposal.status]} border-none font-medium`}>
                  {proposal.status}
                </Badge>
              </div>

              <div className="space-y-1 mb-6">
                <p className="text-sm font-medium text-gray-900">Cliente: {proposal.client}</p>
                <p className="text-sm text-gray-500">
                  Valor:{' '}
                  <span className="font-semibold text-gray-900">
                    R$ {proposal.value.toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-white">
                  <Download className="h-4 w-4 mr-2" /> Baixar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900"
                >
                  <Send className="h-4 w-4 mr-2" /> Reenviar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

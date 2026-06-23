import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Target, Search, Filter, PhoneCall, Mail } from 'lucide-react'

const leadsMock = [
  { id: 1, name: 'Roberto Silva', company: 'Indústria Metálica SA', source: 'LinkedIn', score: 85 },
  {
    id: 2,
    name: 'Cláudia Santos',
    company: 'Serviços de TI Ltda',
    source: 'Site Institucional',
    score: 92,
  },
  { id: 3, name: 'Fernando Costa', company: 'Comércio Varejista', source: 'Indicação', score: 45 },
]

export default function Prospeccao() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Prospecção
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie leads em fase inicial e cadência de contatos.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Target className="mr-2 h-4 w-4" /> Importar Leads
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar leads por nome, empresa..." className="pl-8 bg-white" />
        </div>
        <Button variant="outline" className="bg-white">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leadsMock.map((lead) => (
          <Card
            key={lead.id}
            className="hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                  {lead.name}
                </CardTitle>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    lead.score >= 80
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  Score {lead.score}
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">{lead.company}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 mb-4">Origem: {lead.source}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <PhoneCall className="h-3 w-3 mr-2" /> Ligar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-3 w-3 mr-2" /> E-mail
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

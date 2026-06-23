import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '@/services/clientes'
import { Building2, User, Mail, Phone, Briefcase, Calendar } from 'lucide-react'

interface ClienteDetailsSheetProps {
  cliente: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClienteDetailsSheet({ cliente, open, onOpenChange }: ClienteDetailsSheetProps) {
  if (!cliente) return null

  const contatos = cliente.expand?.contatos_via_cliente_id || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <SheetTitle className="text-xl flex items-center gap-2 break-words text-left">
              {cliente.tipo === 'PJ' ? (
                <Building2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <User className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="break-words line-clamp-2">{cliente.nome}</span>
            </SheetTitle>
            <Badge
              variant={
                cliente.status === 'Ativo'
                  ? 'default'
                  : cliente.status === 'Lead'
                    ? 'secondary'
                    : 'outline'
              }
              className={
                cliente.status === 'Ativo'
                  ? 'bg-green-100 text-green-800 shrink-0'
                  : cliente.status === 'Lead'
                    ? 'bg-blue-100 text-blue-800 shrink-0'
                    : 'bg-gray-100 text-gray-800 shrink-0'
              }
            >
              {cliente.status}
            </Badge>
          </div>
          <SheetDescription>Detalhes do cliente e contatos associados.</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Tipo</span>
                <span className="font-medium">{cliente.tipo}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Documento</span>
                <span className="font-medium">{cliente.documento || '-'}</span>
              </div>
              {cliente.tipo === 'PJ' && (
                <>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Nome Fantasia</span>
                    <span className="font-medium">{cliente.nome_fantasia || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Segmento</span>
                    <span className="font-medium">{cliente.segmento}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Porte</span>
                    <span className="font-medium">{cliente.porte}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-500 block">Data de Cadastro</span>
                <span className="font-medium">
                  {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Contatos</h3>
            {contatos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum contato cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {contatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="bg-gray-50 p-4 rounded-lg space-y-2 relative border border-gray-100"
                  >
                    {contato.is_principal && (
                      <Badge className="absolute top-3 right-3 bg-[#FF6B00] hover:bg-[#FF6B00] text-[10px] px-1.5 py-0 h-4">
                        Principal
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 font-medium text-gray-900 pr-16">
                      <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{contato.nome || 'Sem nome'}</span>
                    </div>
                    {contato.cargo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contato.cargo}</span>
                      </div>
                    )}
                    {contato.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contato.email}</span>
                      </div>
                    )}
                    {contato.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{contato.telefone}</span>
                      </div>
                    )}
                    {contato.data_aniversario && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {new Date(contato.data_aniversario).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

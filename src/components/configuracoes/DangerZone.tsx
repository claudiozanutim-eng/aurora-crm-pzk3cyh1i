import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FilteredPurgeDialog, type PurgeTarget } from './FilteredPurgeDialog'

const PURGE_TARGETS: PurgeTarget[] = [
  {
    collection: 'clientes',
    label: 'Excluir Clientes',
    warning:
      'Esta ação é irreversível. Os clientes selecionados e seus dados vinculados serão removidos permanentemente.',
    statusOptions: [
      { value: 'Ativo', label: 'Ativo' },
      { value: 'Inativo', label: 'Inativo' },
      { value: 'Prospect', label: 'Prospect' },
    ],
  },
  {
    collection: 'contatos',
    label: 'Excluir Contatos',
    warning: 'Esta ação é irreversível. Os contatos selecionados serão removidos permanentemente.',
  },
  {
    collection: 'leads',
    label: 'Excluir Leads',
    warning: 'Esta ação é irreversível. Os leads selecionados serão removidos permanentemente.',
    statusOptions: [
      { value: 'Novos Leads', label: 'Novos Leads' },
      { value: 'Primeiro Contato', label: 'Primeiro Contato' },
      { value: 'Qualificando', label: 'Qualificando' },
      { value: 'Não Qualificado', label: 'Não Qualificado' },
      { value: 'Convertido', label: 'Convertido' },
    ],
  },
]

export function DangerZone() {
  const [openTarget, setOpenTarget] = useState<PurgeTarget | null>(null)

  return (
    <>
      <Card className="border-2 border-red-200 shadow-subtle">
        <CardHeader className="border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-700">Zona de Perigo</CardTitle>
          </div>
          <CardDescription className="text-red-600/80">
            Estas ações são irreversíveis. Tenha certeza antes de prosseguir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {PURGE_TARGETS.map((target) => (
            <div
              key={target.collection}
              className="flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-white p-4"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{target.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{target.warning}</p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
                onClick={() => setOpenTarget(target)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <FilteredPurgeDialog
        target={openTarget}
        onOpenChange={(open) => !open && setOpenTarget(null)}
      />
    </>
  )
}

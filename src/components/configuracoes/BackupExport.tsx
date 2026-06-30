import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { exportBackup, downloadBackup } from '@/services/backup'
import { toast } from 'sonner'

const EXPORT_TARGETS = [
  { collection: 'clientes' as const, label: 'Exportar Clientes' },
  { collection: 'contatos' as const, label: 'Exportar Contatos' },
  { collection: 'leads' as const, label: 'Exportar Leads' },
]

export function BackupExport() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (collection: 'clientes' | 'contatos' | 'leads', label: string) => {
    setLoading(collection)
    try {
      const result = await exportBackup(collection)
      const date = new Date().toISOString().split('T')[0]
      downloadBackup(result.base64, `backup_${collection}_${date}.csv`)
      toast.success(`${label} exportado com sucesso!`)
    } catch {
      toast.error('Erro ao exportar dados')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="shadow-subtle border-gray-100">
      <CardHeader>
        <CardTitle>Exportação de Backup</CardTitle>
        <CardDescription>Baixe um backup completo dos dados em formato CSV.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {EXPORT_TARGETS.map(({ collection, label }) => (
          <Button
            key={collection}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => handleExport(collection, label)}
            disabled={loading !== null}
          >
            {loading === collection ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Download, Loader2, Plus, Trash2, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  getBackups,
  generateBackup,
  getBackupFileUrl,
  deleteBackup,
  type Backup,
} from '@/services/backups'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadBackups = useCallback(async () => {
    try {
      const data = await getBackups()
      setBackups(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  useRealtime('backups', () => {
    loadBackups()
  })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateBackup()
      toast.success('Backup gerado com sucesso!')
      loadBackups()
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Erro ao gerar backup'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (backup: Backup) => {
    const url = getBackupFileUrl(backup)
    window.open(url, '_blank')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteBackup(id)
      toast.success('Backup removido com sucesso!')
      loadBackups()
    } catch {
      toast.error('Erro ao remover backup')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="shadow-subtle border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Gerenciamento de Backups</CardTitle>
            <CardDescription>Visualize, baixe e gerencie backups do sistema.</CardDescription>
          </div>
          <Button
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white shrink-0"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Gerar Backup Agora
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <FileJson className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum backup encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "Gerar Backup Agora" para criar o primeiro.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] rounded-md border border-gray-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Data/Hora</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Criado por</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Tipo</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Tamanho</th>
                  <th className="text-right font-medium text-gray-600 px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {formatDate(backup.created)}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {backup.expand?.usuario_id?.name || 'Sistema'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={
                          backup.tipo === 'Manual'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }
                      >
                        {backup.tipo}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{backup.tamanho || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownload(backup)}
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          onClick={() => handleDelete(backup.id)}
                          disabled={deletingId === backup.id}
                          title="Excluir"
                        >
                          {deletingId === backup.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

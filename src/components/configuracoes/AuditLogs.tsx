import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getAuditoriaLogs, type AuditoriaLog } from '@/services/auditoria'
import { useRealtime } from '@/hooks/use-realtime'

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

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    try {
      const data = await getAuditoriaLogs()
      setLogs(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])
  useRealtime('auditoria', () => {
    loadLogs()
  })

  return (
    <Card className="shadow-subtle border-gray-100">
      <CardHeader>
        <CardTitle>Logs de Auditoria</CardTitle>
        <CardDescription>Histórico de ações administrativas realizadas no sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border border-gray-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Data</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Usuário</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Ação</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Recurso</th>
                  <th className="text-left font-medium text-gray-600 px-3 py-2">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {formatDate(log.created)}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {log.expand?.usuario_id?.name || 'Sistema'}
                    </td>
                    <td className="px-3 py-2 text-gray-900">{log.acao}</td>
                    <td className="px-3 py-2 text-gray-600">{log.recurso}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-xs truncate" title={log.detalhes}>
                      {log.detalhes || '-'}
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

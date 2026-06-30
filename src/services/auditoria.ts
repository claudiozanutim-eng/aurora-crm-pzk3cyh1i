import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface AuditoriaLog extends RecordModel {
  usuario_id: string
  acao: string
  recurso: string
  detalhes?: string
  expand?: {
    usuario_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getAuditoriaLogs = async () => {
  return pb.collection('auditoria').getFullList<AuditoriaLog>({
    expand: 'usuario_id',
    sort: '-created',
    batch: 500,
  })
}

import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Backup extends RecordModel {
  arquivo: string
  tipo: 'Manual' | 'Automático - Exclusão'
  usuario_id: string
  tamanho: string
  expand?: {
    usuario_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getBackups = async () => {
  return pb.collection('backups').getFullList<Backup>({
    expand: 'usuario_id',
    sort: '-created',
  })
}

export const generateBackup = async () => {
  return pb.send('/backend/v1/generate-backup', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const getBackupFileUrl = (backup: Backup) => {
  return pb.files.getURL(backup, backup.arquivo)
}

export const deleteBackup = async (id: string) => {
  return pb.collection('backups').delete(id)
}

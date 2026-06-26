import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Interacao extends RecordModel {
  cliente_id?: string
  lead_id?: string
  tipo:
    | 'E-mail'
    | 'WhatsApp'
    | 'Telefonema'
    | 'Reunião'
    | 'Proposta Enviada'
    | 'Enviar Proposta'
    | 'Proposta Aprovada'
  data_hora: string
  vendedor_id: string
  resumo: string
  expand?: { vendedor_id?: { name: string } }
}

export const getInteracoes = async (targetId: string, targetType: 'cliente' | 'lead') => {
  const filter = targetType === 'cliente' ? `cliente_id="${targetId}"` : `lead_id="${targetId}"`
  return pb.collection('interacoes').getFullList<Interacao>({
    filter,
    sort: '-data_hora',
    expand: 'vendedor_id',
  })
}

export const createInteracao = async (data: Partial<Interacao>) => {
  return pb.collection('interacoes').create<Interacao>(data)
}

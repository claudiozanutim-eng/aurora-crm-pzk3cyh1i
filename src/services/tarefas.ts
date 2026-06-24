import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Tarefa extends RecordModel {
  cliente_id?: string
  lead_id?: string
  vendedor_id: string
  descricao: string
  data_limite: string
  tipo?: 'E-mail' | 'WhatsApp' | 'Telefonema' | 'Reunião' | 'Proposta Enviada' | 'Enviar Proposta'
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Atrasada'
  expand?: {
    vendedor_id?: { id: string; name: string }
    cliente_id?: { id: string; nome: string }
    lead_id?: { id: string; nome: string }
  }
}

export const getAllTarefas = async () => {
  return pb.collection('tarefas').getFullList<Tarefa>({
    sort: 'data_limite',
    expand: 'vendedor_id,cliente_id,lead_id',
  })
}

export const getTarefas = async (targetId: string, targetType: 'cliente' | 'lead') => {
  const baseFilter = targetType === 'cliente' ? `cliente_id="${targetId}"` : `lead_id="${targetId}"`
  return pb.collection('tarefas').getFullList<Tarefa>({
    filter: `${baseFilter} && status != 'Concluída'`,
    sort: 'status,data_limite',
    expand: 'vendedor_id',
  })
}

export const createTarefa = async (data: Partial<Tarefa>) => {
  return pb.collection('tarefas').create<Tarefa>(data)
}

export const updateTarefa = async (id: string, data: Partial<Tarefa>) => {
  return pb.collection('tarefas').update<Tarefa>(id, data)
}

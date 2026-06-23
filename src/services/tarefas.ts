import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Tarefa extends RecordModel {
  cliente_id?: string
  lead_id?: string
  vendedor_id: string
  descricao: string
  data_limite: string
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Atrasada'
  expand?: { vendedor_id?: { name: string } }
}

export const getTarefas = async (targetId: string, targetType: 'cliente' | 'lead') => {
  const filter = targetType === 'cliente' ? `cliente_id="${targetId}"` : `lead_id="${targetId}"`
  return pb.collection('tarefas').getFullList<Tarefa>({
    filter,
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

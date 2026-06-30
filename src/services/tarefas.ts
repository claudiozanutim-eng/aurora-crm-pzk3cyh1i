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

export const deleteTarefa = async (id: string) => {
  return pb.collection('tarefas').delete(id)
}

export const buildTarefasFilter = (options: {
  search?: string
  vendedorId?: string
  status?: string
  prioridade?: string
  clienteId?: string
  mostrarConcluidas?: boolean
}): string => {
  const filters: string[] = []
  if (!options.mostrarConcluidas) filters.push('status != "Concluída"')
  if (options.vendedorId && options.vendedorId !== 'all')
    filters.push(`vendedor_id = "${options.vendedorId}"`)
  if (options.status && options.status !== 'all') filters.push(`status = "${options.status}"`)
  if (options.prioridade && options.prioridade !== 'all')
    filters.push(`prioridade = "${options.prioridade}"`)
  if (options.clienteId && options.clienteId !== 'all')
    filters.push(`cliente_id = "${options.clienteId}"`)
  const s = (options.search || '').replace(/"/g, '').trim()
  if (s) filters.push(`(descricao ~ "${s}" || cliente_id.nome ~ "${s}")`)
  return filters.join(' && ')
}

export const getTarefasPaginated = async (
  page: number,
  perPage: number,
  options: {
    search?: string
    vendedorId?: string
    status?: string
    prioridade?: string
    clienteId?: string
    mostrarConcluidas?: boolean
  },
) => {
  const filter = buildTarefasFilter(options)
  const result = await pb.collection('tarefas').getList<Tarefa>(page, perPage, {
    filter: filter || undefined,
    sort: 'data_limite',
    expand: 'vendedor_id,cliente_id,lead_id',
  })
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  }
}

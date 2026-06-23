import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { Cliente } from './clientes'
import type { Negocio } from './negocios'

export interface Proposta extends RecordModel {
  titulo: string
  cliente_id: string
  negocio_id?: string
  valor_total: number
  descricao_servicos: string
  condicoes_comerciais: string
  validade_dias: number
  status: 'Rascunho' | 'Enviada' | 'Aprovada' | 'Rejeitada' | 'Expirada'
  data_envio?: string
  expand?: {
    cliente_id?: Cliente
    negocio_id?: Negocio
  }
}

export const getPropostas = () =>
  pb
    .collection<Proposta>('propostas')
    .getFullList({ expand: 'cliente_id,negocio_id', sort: '-created' })
export const getPropostaById = (id: string) =>
  pb.collection<Proposta>('propostas').getOne(id, { expand: 'cliente_id,negocio_id' })
export const createProposta = (data: Partial<Proposta>) =>
  pb.collection<Proposta>('propostas').create(data)
export const updateProposta = (id: string, data: Partial<Proposta>) =>
  pb.collection<Proposta>('propostas').update(id, data)
export const deleteProposta = (id: string) => pb.collection<Proposta>('propostas').delete(id)

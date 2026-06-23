import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import { Cliente, Contato } from './clientes'

export interface Negocio extends RecordModel {
  cliente_id: string
  vendedor_id: string
  valor_estimado: number
  probabilidade?: number
  probabilidade_nivel?: 'Alta' | 'Média' | 'Baixa'
  data_prevista_fechamento?: string
  data_fechamento_real?: string
  status:
    | 'Prospecção'
    | 'Qualificação'
    | 'Proposta Enviada'
    | 'Negociação'
    | 'Fechado/Ganho'
    | 'Perdido'
  prioridade: 'Alta' | 'Média' | 'Baixa'
  descricao?: string
  ciclo_vendas_dias?: number
  motivo_perda?: 'Desistiu do Projeto' | 'Preço' | 'Preferiu Concorrente' | 'Cliente Sumiu'
  expand?: {
    cliente_id?: Cliente & {
      expand?: {
        contatos_via_cliente_id?: Contato[]
      }
    }
  }
}

export const getNegocios = async () => {
  return pb.collection('negocios').getFullList<Negocio>({
    expand: 'cliente_id.contatos_via_cliente_id',
    sort: '-created',
  })
}

export const createNegocio = async (data: Partial<Negocio>) => {
  return pb.collection('negocios').create<Negocio>(data)
}

export const updateNegocio = async (id: string, data: Partial<Negocio>) => {
  return pb.collection('negocios').update<Negocio>(id, data)
}

export const deleteNegocio = async (id: string) => {
  return pb.collection('negocios').delete(id)
}

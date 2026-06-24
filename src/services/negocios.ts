import pb from '@/lib/pocketbase/client'

export interface Negocio {
  id: string
  cliente_id: string
  valor_estimado: number
  probabilidade: number
  data_prevista_fechamento: string
  data_fechamento_real: string
  status:
    | 'Prospecção'
    | 'Qualificação'
    | 'Proposta Enviada'
    | 'Negociação'
    | 'Fechado/Ganho'
    | 'Perdido'
  prioridade: 'Alta' | 'Média' | 'Baixa'
  descricao: string
  ciclo_vendas_dias: number
  probabilidade_nivel: 'Alta' | 'Média' | 'Baixa'
  motivo_perda: string
  vendedor_id: string
  created: string
  updated: string
  expand?: any
}

export const getNegocios = async (options?: any) => {
  return await pb.collection('negocios').getFullList<Negocio>({
    sort: '-updated',
    expand: 'cliente_id,cliente_id.contatos_via_cliente_id,vendedor_id',
    ...options,
  })
}

export const createNegocio = async (data: Partial<Negocio>) => {
  return await pb.collection('negocios').create<Negocio>(data)
}

export const updateNegocio = async (id: string, data: Partial<Negocio>) => {
  return await pb.collection('negocios').update<Negocio>(id, data)
}

export const deleteNegocio = async (id: string) => {
  return await pb.collection('negocios').delete(id)
}

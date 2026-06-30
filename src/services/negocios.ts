import pb from '@/lib/pocketbase/client'

export interface Negocio {
  id: string
  cliente_id: string
  valor_estimado: number
  probabilidade: number
  data_prevista_fechamento: string
  data_fechamento_real: string
  status: 'Prospect' | 'Proposta Enviada' | 'Negociação' | 'Stand By' | 'Fechado/Ganho' | 'Perdido'
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

export const buildNegociosFilter = (options: {
  search?: string
  vendedorId?: string
  periodo?: string
}): string => {
  const filters: string[] = [`status != ""`]
  if (options.vendedorId && options.vendedorId !== 'todos') {
    filters.push(`vendedor_id = "${options.vendedorId}"`)
  }
  if (options.periodo && options.periodo !== 'todos') {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    let start = '',
      end = ''
    if (options.periodo === 'este_mes') {
      start = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
      end = fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59))
    } else if (options.periodo === 'mes_passado') {
      start = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      end = fmt(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59))
    } else if (options.periodo === 'este_ano') {
      start = fmt(new Date(now.getFullYear(), 0, 1))
      end = fmt(new Date(now.getFullYear(), 11, 31, 23, 59, 59))
    }
    if (start && end) {
      filters.push(
        `((status != "Fechado/Ganho" && status != "Perdido") || ((status = "Fechado/Ganho" || status = "Perdido") && data_fechamento_real >= "${start}" && data_fechamento_real <= "${end}"))`,
      )
    }
  }
  const s = (options.search || '').replace(/"/g, '').trim()
  if (s) {
    filters.push(
      `(cliente_id.nome ~ "${s}" || cliente_id.nome_fantasia ~ "${s}" || descricao ~ "${s}")`,
    )
  }
  return filters.join(' && ')
}

export const getNegociosPaginated = async (
  page: number,
  perPage: number,
  options: { search?: string; vendedorId?: string; periodo?: string },
) => {
  const filter = buildNegociosFilter(options)
  const result = await pb.collection('negocios').getList<Negocio>(page, perPage, {
    filter,
    sort: '-updated',
    expand: 'cliente_id,cliente_id.contatos_via_cliente_id,vendedor_id',
  })
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  }
}

import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Contato extends RecordModel {
  cliente_id: string
  nome: string
  email: string
  telefone: string
  telefone_fixo?: string
  cargo?: string
  data_aniversario?: string
  is_principal: boolean
}

export interface Cliente extends RecordModel {
  tipo: 'PF' | 'PJ'
  documento: string
  nome: string
  nome_fantasia?: string
  segmento:
    | 'Educação'
    | 'Tecnologia'
    | 'Varejo'
    | 'Agro'
    | 'Indústria'
    | 'Serviços'
    | 'Cooperativa'
    | 'Outro'
  porte: 'Micro' | 'Pequeno' | 'Médio' | 'Grande'
  status: 'Ativo' | 'Inativo' | 'Prospect'
  data_cadastro: string
  observacoes?: string
  tags?: string[]
  pais?: string
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  expand?: {
    contatos_via_cliente_id?: Contato[]
  }
}

export const getClientes = async () => {
  return pb.collection('clientes').getFullList<Cliente>({
    expand: 'contatos_via_cliente_id',
    sort: '-created',
  })
}

export const createClienteEContatos = async (
  clienteData: Partial<Cliente>,
  contatosData: Partial<Contato>[],
) => {
  const cliente = await pb.collection('clientes').create<Cliente>(clienteData)

  try {
    for (let i = 0; i < contatosData.length; i++) {
      await pb.collection('contatos').create({
        ...contatosData[i],
        cliente_id: cliente.id,
        is_principal: i === 0,
      })
    }
  } catch (error) {
    console.error('Failed to create contacts:', error)
    throw error
  }

  return cliente
}

export const updateClienteEContatos = async (
  id: string,
  clienteData: Partial<Cliente>,
  contatosData: Partial<Contato>[],
) => {
  const cliente = await pb.collection('clientes').update<Cliente>(id, clienteData)

  try {
    const existingContacts = await pb.collection('contatos').getFullList({
      filter: `cliente_id = "${id}"`,
    })
    for (const contact of existingContacts) {
      await pb.collection('contatos').delete(contact.id)
    }

    for (let i = 0; i < contatosData.length; i++) {
      await pb.collection('contatos').create({
        ...contatosData[i],
        cliente_id: cliente.id,
        is_principal: i === 0,
      })
    }
  } catch (error) {
    console.error('Failed to update contacts:', error)
    throw error
  }

  return cliente
}

export const getClienteById = async (id: string) => {
  return pb.collection('clientes').getOne<Cliente>(id, { expand: 'contatos_via_cliente_id' })
}

export const updateCliente = async (id: string, data: Partial<Cliente>) => {
  return pb.collection('clientes').update<Cliente>(id, data)
}

export const deleteCliente = async (id: string) => {
  try {
    const existingContacts = await pb.collection('contatos').getFullList({
      filter: `cliente_id = "${id}"`,
    })
    for (const contact of existingContacts) {
      await pb.collection('contatos').delete(contact.id)
    }

    const existingNegocios = await pb.collection('negocios').getFullList({
      filter: `cliente_id = "${id}"`,
    })
    for (const negocio of existingNegocios) {
      await pb.collection('negocios').delete(negocio.id)
    }
  } catch (err) {
    console.error('Failed to delete related records', err)
  }
  return pb.collection('clientes').delete(id)
}

export const buildClientesFilter = (search?: string, status?: string, tipo?: string): string => {
  const filters: string[] = []
  const s = (search || '').replace(/"/g, '').trim()
  if (s) filters.push(`(nome ~ "${s}" || nome_fantasia ~ "${s}" || documento ~ "${s}")`)
  if (status && status !== 'Todos') filters.push(`status = "${status}"`)
  if (tipo && tipo !== 'Todos') filters.push(`tipo = "${tipo}"`)
  return filters.join(' && ')
}

const clientesSortMap: Record<string, string> = {
  'nome-asc': 'nome',
  'nome-desc': '-nome',
  'data_cadastro-desc': '-created',
  'data_cadastro-asc': 'created',
  'last_contact-desc': '-updated',
  'last_contact-asc': 'updated',
}

export const getClientesPaginated = async (
  page: number,
  perPage: number,
  options: { search?: string; status?: string; tipo?: string; sort?: string },
) => {
  const filter = buildClientesFilter(options.search, options.status, options.tipo)
  const result = await pb.collection('clientes').getList<Cliente>(page, perPage, {
    filter: filter || undefined,
    sort: clientesSortMap[options.sort || 'nome-asc'] || 'nome',
    expand: 'contatos_via_cliente_id',
  })
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  }
}

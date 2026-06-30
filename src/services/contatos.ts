import pb from '@/lib/pocketbase/client'
import type { Contato, Cliente } from './clientes'

export const getAllContatos = async () => {
  return pb.collection('contatos').getFullList<Contato & { expand?: { cliente_id: Cliente } }>({
    expand: 'cliente_id',
    sort: '-created',
  })
}

export const getContatosByClienteId = async (clienteId: string) => {
  return pb.collection('contatos').getFullList<Contato>({
    filter: `cliente_id="${clienteId}"`,
    sort: '-is_principal,nome',
  })
}

export const createContato = async (data: Partial<Contato>) => {
  return pb.collection('contatos').create<Contato>(data)
}

export const updateContato = async (id: string, data: Partial<Contato>) => {
  return pb.collection('contatos').update<Contato>(id, data)
}

export const deleteContato = async (id: string) => {
  return pb.collection('contatos').delete(id)
}

export const setContatoPrincipal = async (clienteId: string, contatoId: string) => {
  const contatos = await getContatosByClienteId(clienteId)
  for (const c of contatos) {
    if (c.id === contatoId && !c.is_principal) {
      await pb.collection('contatos').update(c.id, { is_principal: true })
    } else if (c.id !== contatoId && c.is_principal) {
      await pb.collection('contatos').update(c.id, { is_principal: false })
    }
  }
}

export const buildContatosFilter = (search?: string): string => {
  const filters: string[] = ['nome != ""']
  const s = (search || '').replace(/"/g, '').trim()
  if (s) filters.push(`(nome ~ "${s}" || email ~ "${s}" || cliente_id.nome ~ "${s}")`)
  return filters.join(' && ')
}

export const getContatosPaginated = async (page: number, perPage: number, search?: string) => {
  const filter = buildContatosFilter(search)
  const result = await pb
    .collection('contatos')
    .getList<Contato & { expand?: { cliente_id: Cliente } }>(page, perPage, {
      filter,
      expand: 'cliente_id',
      sort: '-created',
    })
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  }
}

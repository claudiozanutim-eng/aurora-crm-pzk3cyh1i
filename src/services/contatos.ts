import pb from '@/lib/pocketbase/client'
import type { Contato } from './clientes'

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

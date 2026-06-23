import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Contato extends RecordModel {
  cliente_id: string
  nome: string
  email: string
  telefone: string
  cargo?: string
  data_aniversario?: string
  is_principal: boolean
}

export interface Cliente extends RecordModel {
  tipo: 'PF' | 'PJ'
  documento: string
  nome: string
  nome_fantasia?: string
  segmento: 'Educação' | 'Tecnologia' | 'Varejo' | 'Outro'
  porte: 'Micro' | 'Pequeno' | 'Médio' | 'Grande'
  status: 'Ativo' | 'Inativo' | 'Lead'
  data_cadastro: string
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

import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import { createClienteEContatos } from './clientes'
import { createNegocio } from './negocios'

export interface Lead extends RecordModel {
  nome: string
  contato_nome?: string
  telefone?: string
  email?: string
  tipo: 'PF' | 'PJ'
  origem: 'Indicação' | 'Site' | 'Redes Sociais' | 'Evento' | 'Outro'
  segmento:
    | 'Educação'
    | 'Tecnologia'
    | 'Varejo'
    | 'Agro'
    | 'Indústria'
    | 'Serviços'
    | 'Cooperativa'
    | 'Outro'
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status: 'Novos Leads' | 'Primeiro Contato' | 'Qualificando' | 'Não Qualificado' | 'Convertido'
  vendedor_id: string
}

export const getLeads = async () => {
  return pb.collection('leads').getFullList<Lead>({
    sort: '-created',
  })
}

export const createLead = async (data: Partial<Lead>) => {
  return pb.collection('leads').create<Lead>(data)
}

export const updateLead = async (id: string, data: Partial<Lead>) => {
  return pb.collection('leads').update<Lead>(id, data)
}

export const deleteLead = async (id: string) => {
  return pb.collection('leads').delete(id)
}

export const convertLeadToSale = async (lead: Lead) => {
  const clienteData = {
    tipo: lead.tipo,
    nome: lead.nome,
    segmento: lead.segmento as any,
    porte: 'Pequeno',
    status: 'Lead',
    data_cadastro: new Date().toISOString().substring(0, 10),
  } as any

  const contatosData = [
    {
      nome: lead.contato_nome || lead.nome,
      email: lead.email || '',
      telefone: lead.telefone || '',
      is_principal: true,
    },
  ] as any

  const newClient = await createClienteEContatos(clienteData, contatosData)

  await createNegocio({
    cliente_id: newClient.id,
    vendedor_id: lead.vendedor_id,
    valor_estimado: 0,
    status: 'Prospecção',
    prioridade: lead.prioridade,
  })

  return updateLead(lead.id, { status: 'Convertido' })
}

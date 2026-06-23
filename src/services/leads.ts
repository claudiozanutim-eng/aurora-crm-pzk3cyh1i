import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

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
  observacoes?: string
}

export const getLeadById = async (id: string) => {
  return pb.collection('leads').getOne<Lead>(id)
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
  return pb.send('/backend/v1/convert-lead', {
    method: 'POST',
    body: JSON.stringify({ lead_id: lead.id }),
    headers: { 'Content-Type': 'application/json' },
  })
}

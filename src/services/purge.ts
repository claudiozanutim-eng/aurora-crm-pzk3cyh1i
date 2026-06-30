import pb from '@/lib/pocketbase/client'

export type PurgeCollection = 'clientes' | 'contatos' | 'leads'

export interface PurgeFilters {
  status?: string[]
  dataInicio?: string
  dataFim?: string
}

export const purgeData = async (
  collection: PurgeCollection,
  password: string,
  filters?: PurgeFilters,
) => {
  return pb.send('/backend/v1/purge-data', {
    method: 'POST',
    body: JSON.stringify({
      collection,
      password,
      status: filters?.status,
      data_inicio: filters?.dataInicio,
      data_fim: filters?.dataFim,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const purgeCollection = (collection: PurgeCollection, password: string) =>
  purgeData(collection, password)

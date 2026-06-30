import pb from '@/lib/pocketbase/client'

type BackupCollection = 'clientes' | 'contatos' | 'leads'

export const exportBackup = async (collection: BackupCollection) => {
  const records = await pb.collection(collection).getFullList()
  const ids = records.map((r) => r.id)

  const result = await pb.send('/backend/v1/spreadsheet/export', {
    method: 'POST',
    body: JSON.stringify({ source: collection, ids, format: 'csv' }),
    headers: { 'Content-Type': 'application/json' },
  })

  return result as { base64: string; type: string }
}

export const downloadBackup = (base64: string, filename: string) => {
  const link = document.createElement('a')
  link.href = `data:text/csv;base64,${base64}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

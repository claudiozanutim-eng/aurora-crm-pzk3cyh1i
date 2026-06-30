export function isPlaceholderContactName(
  contactName: string | undefined | null,
  clienteNome: string | undefined | null,
  clienteNomeFantasia?: string | undefined | null,
): boolean {
  if (!contactName || !contactName.trim()) return true
  const normalized = contactName.trim().toLowerCase()
  if (clienteNome && normalized === clienteNome.trim().toLowerCase()) return true
  if (clienteNomeFantasia && normalized === clienteNomeFantasia.trim().toLowerCase()) return true
  return false
}

export function displayContactName(
  contactName: string | undefined | null,
  clienteNome: string | undefined | null,
  clienteNomeFantasia?: string | undefined | null,
): string {
  if (isPlaceholderContactName(contactName, clienteNome, clienteNomeFantasia)) return '-'
  return contactName || '-'
}

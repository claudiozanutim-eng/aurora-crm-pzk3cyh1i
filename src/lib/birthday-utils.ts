export function isBirthdayToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const today = new Date()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  const datePart = dateStr.split(' ')[0]
  const parts = datePart.split('-')
  if (parts.length < 3) return false
  return parts[1] === todayMonth && parts[2] === todayDay
}

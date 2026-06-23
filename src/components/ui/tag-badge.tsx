import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  let colorClass = 'bg-gray-100 text-gray-800 border-transparent hover:bg-gray-200'
  const lower = tag.toLowerCase()

  if (lower === 'frio') {
    colorClass = 'bg-blue-100 text-blue-800 border-transparent hover:bg-blue-200'
  } else if (lower === 'quente') {
    colorClass = 'bg-red-100 text-red-800 border-transparent hover:bg-red-200'
  } else if (lower === 'parceria') {
    colorClass = 'bg-purple-100 text-purple-800 border-transparent hover:bg-purple-200'
  } else if (lower === 'urgente') {
    colorClass = 'bg-orange-100 text-orange-800 border-transparent hover:bg-orange-200'
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-medium px-2 py-0.5 whitespace-nowrap', colorClass, className)}
    >
      {tag}
    </Badge>
  )
}

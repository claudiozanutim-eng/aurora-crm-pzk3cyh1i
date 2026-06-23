import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  let bgColor = 'bg-gray-100 hover:bg-gray-200'
  let textColor = 'text-gray-800'

  if (tag === 'Frio') {
    bgColor = 'bg-blue-100 hover:bg-blue-200'
    textColor = 'text-blue-800'
  } else if (tag === 'Quente') {
    bgColor = 'bg-orange-100 hover:bg-orange-200'
    textColor = 'text-orange-800'
  } else if (tag === 'Parceria') {
    bgColor = 'bg-green-100 hover:bg-green-200'
    textColor = 'text-green-800'
  }

  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', bgColor, textColor, className)}
    >
      {tag}
    </Badge>
  )
}

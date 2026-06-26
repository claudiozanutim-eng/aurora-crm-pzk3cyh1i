import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuro } from '@/hooks/use-auro'

interface AuroAvatarProps {
  className?: string
  imageClassName?: string
}

export function AuroAvatar({ className, imageClassName }: AuroAvatarProps) {
  const { isAvatarLoaded, avatarSrc } = useAuro()
  const [error, setError] = useState(false)

  return (
    <div className={cn('relative flex items-center justify-center shrink-0', className)}>
      {!error && isAvatarLoaded ? (
        <img
          src={avatarSrc}
          alt="Auro"
          className={cn('h-full w-full object-contain', imageClassName)}
          onError={() => setError(true)}
        />
      ) : isAvatarLoaded ? (
        <div
          className={cn(
            'h-full w-full rounded-full bg-[#e55320] flex items-center justify-center text-white font-bold',
            imageClassName,
          )}
        >
          A
        </div>
      ) : null}
    </div>
  )
}

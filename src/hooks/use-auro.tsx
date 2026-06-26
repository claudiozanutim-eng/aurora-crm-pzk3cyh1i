import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import auroAvatarSrc from '@/assets/image24459793-7340-4e96-9dcd-6e71cc4b1e4d-982be.png'

interface AuroContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  conversationId: string | null
  setConversationId: (id: string | null) => void
  triggerAnalysis: (targetType: 'cliente' | 'lead', targetId: string, targetName: string) => void
  initialPrompt: string | null
  clearInitialPrompt: () => void
  analysisContext: { targetType: 'cliente' | 'lead'; targetId: string; targetName: string } | null
  isAvatarLoaded: boolean
  avatarSrc: string
}

const AuroContext = createContext<AuroContextType | undefined>(undefined)

// Pre-create the image instance outside React to start fetching immediately at the highest level
const globalAvatarImage = typeof window !== 'undefined' ? new Image() : null
let isGlobalAvatarLoaded = false

if (globalAvatarImage) {
  globalAvatarImage.src = auroAvatarSrc
  if (globalAvatarImage.complete) {
    isGlobalAvatarLoaded = true
  } else {
    globalAvatarImage.addEventListener('load', () => {
      isGlobalAvatarLoaded = true
    })
    globalAvatarImage.addEventListener('error', () => {
      isGlobalAvatarLoaded = true // proceed anyway to show fallback if needed
    })
  }
}

export function AuroProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(isGlobalAvatarLoaded)
  const [analysisContext, setAnalysisContext] = useState<{
    targetType: 'cliente' | 'lead'
    targetId: string
    targetName: string
  } | null>(null)

  useEffect(() => {
    // If it loaded between initial render and this effect running
    if (isGlobalAvatarLoaded && !isAvatarLoaded) {
      setIsAvatarLoaded(true)
      return
    }

    if (!globalAvatarImage) return

    const handleLoad = () => setIsAvatarLoaded(true)

    globalAvatarImage.addEventListener('load', handleLoad)
    globalAvatarImage.addEventListener('error', handleLoad)

    return () => {
      globalAvatarImage.removeEventListener('load', handleLoad)
      globalAvatarImage.removeEventListener('error', handleLoad)
    }
  }, [isAvatarLoaded])

  const triggerAnalysis = useCallback(
    (targetType: 'cliente' | 'lead', targetId: string, targetName: string) => {
      setAnalysisContext({ targetType, targetId, targetName })
      setInitialPrompt(
        `Por favor, faça uma análise comercial completa do ${targetType} "${targetName}" (ID: ${targetId}). Lembre-se de retornar os 3 blocos principais da análise.`,
      )
      setIsOpen(true)
    },
    [],
  )

  const clearInitialPrompt = useCallback(() => {
    setInitialPrompt(null)
    setAnalysisContext(null)
  }, [])

  return (
    <AuroContext.Provider
      value={{
        isOpen,
        setIsOpen,
        conversationId,
        setConversationId,
        triggerAnalysis,
        initialPrompt,
        clearInitialPrompt,
        analysisContext,
        isAvatarLoaded,
        avatarSrc: auroAvatarSrc,
      }}
    >
      {children}
    </AuroContext.Provider>
  )
}

export const useAuro = () => {
  const context = useContext(AuroContext)
  if (!context) throw new Error('useAuro must be used within an AuroProvider')
  return context
}

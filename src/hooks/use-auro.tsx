import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface AuroContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  conversationId: string | null
  setConversationId: (id: string | null) => void
  triggerAnalysis: (targetType: 'cliente' | 'lead', targetId: string, targetName: string) => void
  initialPrompt: string | null
  clearInitialPrompt: () => void
}

const AuroContext = createContext<AuroContextType | undefined>(undefined)

export function AuroProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)

  const triggerAnalysis = useCallback(
    (targetType: 'cliente' | 'lead', targetId: string, targetName: string) => {
      setInitialPrompt(
        `Por favor, faça uma análise completa do ${targetType} "${targetName}" (ID: ${targetId}). Lembre-se de retornar os 3 blocos principais da análise.`,
      )
      setIsOpen(true)
    },
    [],
  )

  const clearInitialPrompt = useCallback(() => setInitialPrompt(null), [])

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

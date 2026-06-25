import { useState, useRef, useEffect } from 'react'
import { useAuro } from '@/hooks/use-auro'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { streamAgentChat, type DisplayMessage } from '@/lib/skipAi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import auroAvatar from '@/assets/image24459793-7340-4e96-9dcd-6e71cc4b1e4d-982be.png'

export function AuroChatPanel() {
  const { isOpen, setIsOpen, contextData } = useAuro()
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput('')

    let currentInput = userMsg
    if (contextData && messages.length === 0) {
      currentInput = `Contexto: Analisando ${contextData.type} "${contextData.title}" (ID: ${contextData.id}).\n\nUsuário: ${userMsg}`
    }

    const newMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      created: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    abortControllerRef.current = new AbortController()

    try {
      const assistantMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created: new Date().toISOString(),
        },
      ])

      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/auro/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
        body: JSON.stringify({ message: currentInput, conversation_id: conversationId }),
        signal: abortControllerRef.current.signal,
      })

      const result = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: full } : m)),
          )
        },
        onCitations: (citations) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, citations } : m)),
          )
        },
        signal: abortControllerRef.current.signal,
      })

      setConversationId(res.headers.get('X-Conversation-Id') ?? result.conversation_id)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, id: result.message_id, content: result.content, citations: result.citations }
            : m,
        ),
      )
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
            created: new Date().toISOString(),
          },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-orange-100/50">
            <img src={auroAvatar} alt="Auro" className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Auro</h3>
            <p className="text-xs text-gray-500">Assistente IA da IC Educ</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#F97316]/30 shadow-md bg-orange-100/50">
                <img src={auroAvatar} alt="Auro" className="h-full w-full object-cover" />
              </div>
              <p className="text-gray-500 text-sm">
                Olá! Sou o Auro, seu assistente virtual. Como posso ajudar você hoje?
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-sm bg-orange-100/50">
                  <img src={auroAvatar} alt="Auro" className="h-full w-full object-cover" />
                </div>
              )}
              <div
                className={cn(
                  'px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm',
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm',
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-sm bg-orange-100/50">
                <img src={auroAvatar} alt="Auro" className="h-full w-full object-cover" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                <span className="text-sm text-gray-500">Auro está digitando...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Auro..."
            className="flex-1 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-orange-500"
            disabled={isLoading && abortControllerRef.current === null}
          />
          {isLoading ? (
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              size="icon"
              className="rounded-full shrink-0 h-10 w-10"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              className="bg-orange-500 hover:bg-orange-600 rounded-full shrink-0 h-10 w-10 p-0 text-white"
            >
              <Send className="h-4 w-4 ml-1" />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

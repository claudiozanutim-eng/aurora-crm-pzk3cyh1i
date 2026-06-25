import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AuroMessageContent({ content }: { content: string }) {
  const formatText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  if (content.includes('###')) {
    const sections = content.split('###').filter((s) => s.trim().length > 0)
    return (
      <div className="space-y-4">
        {content.startsWith('###') ? null : (
          <div className="whitespace-pre-wrap">{formatText(content.split('###')[0])}</div>
        )}
        {sections.map((section, idx) => {
          const lines = section.trim().split('\n')
          const title = lines[0].trim()
          const body = lines.slice(1).join('\n').trim()

          const isEmail =
            title.toLowerCase().includes('e-mail') || title.toLowerCase().includes('email')

          return (
            <div
              key={idx}
              className="bg-[#F9FAFB] border border-[#F97316]/20 rounded-md p-3 relative"
            >
              <h4 className="text-sm font-semibold text-[#F97316] mb-2">{title}</h4>
              {isEmail ? (
                <div className="pt-8 relative">
                  <CopyButton text={body} />
                  <div className="whitespace-pre-wrap text-sm text-gray-700">{body}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-1">
                  {body.split('\n').map((line, i) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      return (
                        <li key={i} className="ml-4 list-disc marker:text-[#F97316]">
                          {formatText(trimmed.substring(2))}
                        </li>
                      )
                    }
                    return (
                      <p key={i} className="mb-1">
                        {formatText(trimmed)}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return <div className="whitespace-pre-wrap">{formatText(content)}</div>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="absolute top-2 right-2 h-7 text-xs border-[#F97316]/20 hover:bg-[#F97316]/10 text-[#F97316]"
      onClick={handleCopy}
    >
      {copied ? (
        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 mr-1" />
      )}
      {copied ? 'Copiado!' : 'Copiar'}
    </Button>
  )
}

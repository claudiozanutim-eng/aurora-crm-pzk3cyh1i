import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Lead } from '@/services/leads'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

interface LeadConvertModalProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LeadConvertModal({ lead, open, onOpenChange, onSuccess }: LeadConvertModalProps) {
  const [loading, setLoading] = useState(false)
  const [valorEstimado, setValorEstimado] = useState('')
  const { toast } = useToast()

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    if (!numbers) {
      setValorEstimado('')
      return
    }
    const amount = Number(numbers) / 100
    setValorEstimado(
      amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }

  const handleConvert = async () => {
    setLoading(true)
    try {
      const valorNum = valorEstimado
        ? Number(valorEstimado.replace(/\./g, '').replace(',', '.'))
        : null

      await pb.send('/backend/v1/convert-lead', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: lead.id,
          valor_estimado: valorNum,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({
        title: 'Lead convertido com sucesso! O novo negócio já está no seu funil.',
      })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      const fieldErrs = extractFieldErrors(e)
      const errorMsg = getErrorMessage(e)

      let msg =
        fieldErrs.nome ||
        fieldErrs.error ||
        fieldErrs.valor_estimado ||
        errorMsg ||
        'Não foi possível realizar a conversão.'

      if (
        msg.toLowerCase().includes('nome de cliente já existe') ||
        (msg.toLowerCase().includes('nome') && msg.toLowerCase().includes('já existe'))
      ) {
        msg =
          "Este nome de cliente já existe. Por favor, utilize um nome único ou adicione um identificador (ex: 'NOME - Unidade X') para diferenciar o registro."
      } else if (msg === 'Something went wrong.' || msg === 'An unexpected error occurred.') {
        msg =
          'Não foi possível realizar a conversão. Verifique os campos obrigatórios (Cliente, Contato).'
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao converter lead',
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Deseja converter este lead em cliente e abrir um novo negócio?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá gerar um novo cliente, um contato e um novo negócio na coluna "Qualificação".
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Estimado (Opcional)</Label>
            <Input
              id="valor"
              type="text"
              placeholder="0,00"
              value={valorEstimado}
              onChange={handleValorChange}
              disabled={loading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConvert()
            }}
            disabled={loading}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Convertendo...
              </>
            ) : (
              'Sim, converter'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

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
import { convertLeadToSale, Lead } from '@/services/leads'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'

interface LeadConvertModalProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LeadConvertModal({ lead, open, onOpenChange, onSuccess }: LeadConvertModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleConvert = async () => {
    setLoading(true)
    try {
      await convertLeadToSale(lead)
      toast({
        title: 'Lead convertido com sucesso!',
        description: 'O novo negócio já está na coluna Qualificação.',
      })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      const fieldErrs = extractFieldErrors(e)
      const msg =
        fieldErrs.nome ||
        e.response?.message ||
        e.message ||
        'Não foi possível realizar a conversão.'

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

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
        title: 'Lead convertido!',
        description: 'Cliente e negócio criados com sucesso.',
      })
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao converter lead',
        description: 'Não foi possível realizar a conversão.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Converter Lead</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja criar automaticamente um cliente no Funil de Vendas? Isso irá gerar um novo
            cliente, um contato e um novo negócio na coluna "Prospecção".
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
            {loading ? 'Convertendo...' : 'Sim, converter'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

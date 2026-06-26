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
import { Lead, convertLeadToSale } from '@/services/leads'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LeadConvertModalProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LeadConvertModal({ lead, open, onOpenChange, onSuccess }: LeadConvertModalProps) {
  const [loading, setLoading] = useState(false)
  const [valorEstimado, setValorEstimado] = useState('')
  const [clienteNome, setClienteNome] = useState(lead.nome || '')
  const [duplicateWarning, setDuplicateWarning] = useState<string[] | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setClienteNome(lead.nome || '')
      setValorEstimado('')
      setDuplicateWarning(null)
    }
  }, [open, lead])

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

  const handleConvert = async (ignoreDuplicates = false) => {
    setLoading(true)
    try {
      const valorNum = valorEstimado
        ? Number(valorEstimado.replace(/\./g, '').replace(',', '.'))
        : null

      await convertLeadToSale(lead, clienteNome, valorNum, ignoreDuplicates)

      toast({
        title: 'Lead convertido com sucesso! O novo negócio já está no seu funil.',
      })

      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      if (e.status === 409 && e.response?.error === 'duplicate_warning') {
        setDuplicateWarning(e.response.duplicates || [])
        return
      }

      const fieldErrs = extractFieldErrors(e)
      const errorMsg = getErrorMessage(e)

      let msg =
        fieldErrs.cliente_nome ||
        fieldErrs.nome ||
        fieldErrs.error ||
        fieldErrs.valor_estimado ||
        errorMsg ||
        'Não foi possível realizar a conversão.'

      if (
        msg.toLowerCase().includes('nome de cliente já existe') ||
        msg.toLowerCase().includes('já existe um cliente com este nome') ||
        (msg.toLowerCase().includes('nome') && msg.toLowerCase().includes('já existe'))
      ) {
        msg =
          'Já existe um cliente com este nome. Por favor, revise ou adicione um identificador (ex: - Filial).'
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
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && duplicateWarning) {
          setDuplicateWarning(null)
        }
        onOpenChange(isOpen)
      }}
    >
      <AlertDialogContent>
        {duplicateWarning ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Atenção: Dados Duplicados
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-700 mt-2">
                Encontramos registros existentes com os seguintes dados deste lead no sistema:
                <ul className="list-disc pl-5 mt-2 mb-4 font-medium text-gray-900">
                  {duplicateWarning.map((dup) => (
                    <li key={dup}>{dup}</li>
                  ))}
                </ul>
                Deseja continuar e criar um novo cliente mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={(e) => {
                  e.preventDefault()
                  setDuplicateWarning(null)
                }}
                disabled={loading}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleConvert(true)
                }}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  'Continuar mesmo assim'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Deseja converter este lead em cliente e abrir um novo negócio?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá gerar um novo cliente, um contato e um novo negócio na coluna
                "Qualificação".
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                <Input
                  id="cliente_nome"
                  type="text"
                  placeholder="Nome do cliente/empresa"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
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
                  handleConvert(false)
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
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

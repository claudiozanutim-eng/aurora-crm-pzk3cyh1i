import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { purgeCollection } from '@/services/purge'
import { toast } from 'sonner'

type CollectionType = 'clientes' | 'contatos' | 'leads'

interface PurgeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: CollectionType
  title: string
  warningText: string
}

export function PurgeConfirmDialog({
  open,
  onOpenChange,
  collection,
  title,
  warningText,
}: PurgeConfirmDialogProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await purgeCollection(collection, password)
      toast.success(result.message || 'Registros excluídos com sucesso!')
      setPassword('')
      onOpenChange(false)
    } catch (err: any) {
      const errorMsg = err?.response?.error || err?.message || 'Erro ao excluir registros.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-red-700">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm font-medium text-red-600">
            {warningText}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="purge-password" className="text-gray-700">
            Digite sua senha para confirmar
          </Label>
          <Input
            id="purge-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha atual"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password && !loading) {
                handleConfirm()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!password || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Confirmar Exclusão'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { purgeData, type PurgeCollection, type PurgeFilters } from '@/services/purge'

export interface PurgeTarget {
  collection: PurgeCollection
  label: string
  warning: string
  statusOptions?: { value: string; label: string }[]
}

interface FilteredPurgeDialogProps {
  target: PurgeTarget | null
  onOpenChange: (open: boolean) => void
}

export function FilteredPurgeDialog({ target, onOpenChange }: FilteredPurgeDialogProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [purging, setPurging] = useState(false)

  const open = !!target
  const hasStatusFilter = !!target?.statusOptions?.length

  const resetState = useCallback(() => {
    setSelectedStatuses([])
    setDataInicio('')
    setDataFim('')
    setCount(null)
    setPassword('')
  }, [])

  const fetchCount = useCallback(async () => {
    if (!target) return
    setCountLoading(true)
    try {
      const parts: string[] = []
      if (selectedStatuses.length > 0 && target.collection !== 'contatos') {
        parts.push(selectedStatuses.map((s) => `status = "${s}"`).join(' || '))
      }
      if (dataInicio) parts.push(`created >= "${dataInicio} 00:00:00"`)
      if (dataFim) parts.push(`created <= "${dataFim} 23:59:59"`)
      const result = await pb.collection(target.collection).getList(1, 1, {
        filter: parts.length > 0 ? parts.join(' && ') : '',
      })
      setCount(result.totalItems)
    } catch {
      setCount(null)
    } finally {
      setCountLoading(false)
    }
  }, [target, selectedStatuses, dataInicio, dataFim])

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      fetchCount()
    }, 300)
    return () => clearTimeout(timer)
  }, [open, fetchCount])

  const handleConfirm = async () => {
    if (!target || !password) return
    setPurging(true)
    try {
      const filters: PurgeFilters = {}
      if (selectedStatuses.length > 0 && target.collection !== 'contatos')
        filters.status = selectedStatuses
      if (dataInicio) filters.dataInicio = dataInicio
      if (dataFim) filters.dataFim = dataFim
      const result = await purgeData(target.collection, password, filters)
      toast.success(result.message || `${result.count || 0} registro(s) excluído(s)!`)
      onOpenChange(false)
    } catch (err: any) {
      const status = err?.status || err?.response?.status
      const data = err?.response?.data || err?.data
      if (status === 401 || data?.error === 'Senha incorreta') toast.error('Senha incorreta')
      else toast.error(data?.error || data?.message || 'Erro ao remover registros')
    } finally {
      setPurging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-red-700">Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">{target?.warning}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasStatusFilter && (
            <div className="space-y-2">
              <Label className="text-gray-700">Filtrar por Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {target!.statusOptions!.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${opt.value}`}
                      checked={selectedStatuses.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedStatuses([...selectedStatuses, opt.value])
                        else setSelectedStatuses(selectedStatuses.filter((s) => s !== opt.value))
                      }}
                    />
                    <Label htmlFor={`status-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-gray-700">Data de Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Data de Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            {countLoading ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Contando registros...
              </p>
            ) : count !== null ? (
              <p className="text-sm font-medium text-gray-700">
                {count === 0 ? (
                  <span className="text-gray-500">Nenhum registro corresponde aos filtros.</span>
                ) : (
                  <span className="text-red-600">{count} registro(s) serão excluídos.</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Ajuste os filtros para ver a contagem.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purge-password" className="text-gray-700">
              Digite sua senha para confirmar
            </Label>
            <Input
              id="purge-password"
              type="password"
              placeholder="Sua senha atual"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password && !purging && count !== 0) handleConfirm()
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={purging}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleConfirm}
            disabled={!password || purging || count === 0}
          >
            {purging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" /> Confirmar Exclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

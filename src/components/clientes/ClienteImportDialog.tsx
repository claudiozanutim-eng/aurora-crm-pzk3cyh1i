import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

const TARGET_FIELDS = [
  { key: 'tipo', label: 'Tipo (PF/PJ)' },
  { key: 'documento', label: 'Documento (CPF/CNPJ)' },
  { key: 'nome', label: 'Nome / Razão Social' },
  { key: 'nome_fantasia', label: 'Nome Fantasia' },
  { key: 'segmento', label: 'Segmento' },
  { key: 'porte', label: 'Porte' },
  { key: 'status', label: 'Status' },
  { key: 'data_cadastro', label: 'Data de Cadastro' },
]

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  return lines.map((line) => {
    const result = []
    let cur = '',
      inQ = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = !inQ
      } else if (line[i] === ',' && !inQ) {
        result.push(cur)
        cur = ''
      } else cur += line[i]
    }
    result.push(cur)
    return result
  })
}

export function ClienteImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'result'>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{
    success: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setStep('upload')
    setCsvHeaders([])
    setCsvData([])
    setMapping({})
    setResult(null)
  }
  const handleOpenChange = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const processFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const rows = parseCSV(e.target?.result as string)
      if (rows.length > 0) {
        setCsvHeaders(rows[0])
        setCsvData(rows.slice(1))
        const autoMap: Record<string, string> = {}
        rows[0].forEach((h, i) => {
          const l = h.toLowerCase()
          if (l.includes('tipo')) autoMap.tipo = String(i)
          if (l.includes('doc') || l.includes('cpf') || l.includes('cnpj'))
            autoMap.documento = String(i)
          if (l.includes('nome') && !l.includes('fantasia')) autoMap.nome = String(i)
          if (l.includes('fantasia')) autoMap.nome_fantasia = String(i)
          if (l.includes('seg')) autoMap.segmento = String(i)
          if (l.includes('port')) autoMap.porte = String(i)
          if (l.includes('status') || l.includes('situ')) autoMap.status = String(i)
          if (l.includes('data') || l.includes('cadastro')) autoMap.data_cadastro = String(i)
        })
        setMapping(autoMap)
        setStep('mapping')
      }
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    setStep('importing')
    let successCount = 0
    const errorList: { row: number; error: string }[] = []
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      if (row.length === 1 && !row[0]) continue
      const val = (k: string) =>
        mapping[k] && row[Number(mapping[k])] ? row[Number(mapping[k])].trim() : ''
      const tipo = ['PF', 'PJ'].find((t) => t === val('tipo').toUpperCase()) || 'PJ'
      const status =
        ['Ativo', 'Inativo', 'Lead'].find((s) => s.toLowerCase() === val('status').toLowerCase()) ||
        'Lead'
      const segmento =
        [
          'Educação',
          'Tecnologia',
          'Varejo',
          'Agro',
          'Indústria',
          'Serviços',
          'Cooperativa',
          'Outro',
        ].find((s) => s.toLowerCase() === val('segmento').toLowerCase()) || 'Outro'
      const porte =
        ['Micro', 'Pequeno', 'Médio', 'Grande'].find(
          (p) => p.toLowerCase() === val('porte').toLowerCase(),
        ) || 'Micro'
      let dCad = val('data_cadastro')
      if (dCad) {
        if (dCad.includes('/')) {
          const parts = dCad.split(' ')[0].split('/')
          if (parts.length === 3)
            dCad = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString()
        } else {
          const d = new Date(dCad)
          dCad = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
        }
      } else dCad = new Date().toISOString()

      const recordData = {
        tipo,
        documento: val('documento'),
        nome: val('nome') || 'Sem Nome',
        nome_fantasia: val('nome_fantasia'),
        segmento,
        porte,
        status,
        data_cadastro: dCad,
      }
      if (!val('nome')) {
        errorList.push({ row: i + 2, error: 'Nome é obrigatório' })
        continue
      }
      try {
        await pb.collection('clientes').create(recordData)
        successCount++
      } catch (err: any) {
        errorList.push({
          row: i + 2,
          error: err.response?.data?.documento?.message || err.message || 'Erro ao salvar',
        })
      }
    }
    setResult({ success: successCount, errors: errorList })
    setStep('result')
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-[600px] transition-all duration-300',
          step === 'mapping' && 'sm:max-w-[1000px] w-[95vw]',
        )}
      >
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Importe sua base de clientes a partir de um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
            <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Clique ou arraste seu arquivo
            </h3>
            <p className="text-xs text-gray-500 mb-4">Apenas arquivos .csv são suportados</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Selecionar Arquivo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0])
              }}
            />
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Relacione as colunas do seu arquivo aos campos do sistema. O preview abaixo mostra
                os dados reais que serão importados.
              </p>
            </div>

            <ScrollArea className="w-full border rounded-md bg-white">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    {TARGET_FIELDS.map((f) => (
                      <TableHead
                        key={f.key}
                        className="min-w-[220px] max-w-[250px] border-r last:border-r-0 align-top p-4"
                      >
                        <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                          <Database className="w-4 h-4 text-gray-400" />
                          {f.label}
                        </div>
                        <Select
                          value={mapping[f.key] ?? 'none'}
                          onValueChange={(val) =>
                            setMapping((prev) => {
                              const n = { ...prev }
                              if (val === 'none') delete n[f.key]
                              else n[f.key] = val
                              return n
                            })
                          }
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Selecione uma coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-gray-400 italic">
                              Ignorar coluna
                            </SelectItem>
                            {csvHeaders.map((h, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {h || `Coluna ${i + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-gray-100/50 hover:bg-gray-100/50">
                    {TARGET_FIELDS.map((f) => {
                      const colIdx = mapping[f.key]
                      const isMapped = colIdx !== undefined && colIdx !== 'none'
                      return (
                        <TableCell
                          key={f.key}
                          className="border-r last:border-r-0 font-bold text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/80"
                        >
                          {isMapped
                            ? csvHeaders[Number(colIdx)] || `COLUNA ${Number(colIdx) + 1}`
                            : '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {Array.from({ length: Math.min(3, csvData.length) }).map((_, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-transparent">
                      {TARGET_FIELDS.map((f) => {
                        const colIdx = mapping[f.key]
                        const val =
                          colIdx !== undefined && colIdx !== 'none'
                            ? csvData[rowIdx][Number(colIdx)]
                            : ''
                        return (
                          <TableCell
                            key={f.key}
                            className="border-r last:border-r-0 text-sm text-gray-600"
                          >
                            <div className="truncate max-w-[200px]" title={val}>
                              {val || <span className="text-gray-300 italic">vazio</span>}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Cancelar
              </Button>
              <Button onClick={handleImport}>Iniciar Importação</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <h3 className="text-lg font-medium">Importando clientes...</h3>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-center text-lg font-medium">Importação Concluída</h3>
            <div className="grid grid-cols-2 gap-4 text-center border-y py-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-gray-500">Importados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-gray-500">Erros</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Erros:</h4>
                <ScrollArea className="h-[150px] bg-red-50 p-2 rounded-md border border-red-100">
                  <ul className="text-xs space-y-1 text-red-800">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Linha {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

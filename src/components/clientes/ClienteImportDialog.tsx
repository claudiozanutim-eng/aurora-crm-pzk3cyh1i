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
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

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
  const [step, setStep] = useState<'upload' | 'loading' | 'mapping' | 'importing' | 'result'>(
    'upload',
  )
  const [googleUrl, setGoogleUrl] = useState('')
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
    setGoogleUrl('')
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

  const setupMapping = (headers: string[], rows: string[][]) => {
    setCsvHeaders(headers)
    setCsvData(rows)
    const autoMap: Record<string, string> = {}
    headers.forEach((h, i) => {
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

  const processFile = (f: File) => {
    setFile(f)
    setStep('loading')
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string
        const base64 = fileContent.split(',')[1]

        const res = await pb.send('/backend/v1/spreadsheet/parse', {
          method: 'POST',
          body: JSON.stringify({ base64 }),
          headers: { 'Content-Type': 'application/json' },
        })

        setupMapping(res.headers, res.rows)
      } catch (err: any) {
        toast.error(
          err.response?.message || err.message || 'Erro ao processar arquivo. Verifique o formato.',
        )
        setStep('upload')
      }
    }
    reader.readAsDataURL(f)
  }

  const processGoogleUrl = async () => {
    if (!googleUrl) return
    setStep('loading')
    try {
      const res = await pb.send('/backend/v1/spreadsheet/google', {
        method: 'POST',
        body: JSON.stringify({ url: googleUrl }),
        headers: { 'Content-Type': 'application/json' },
      })
      setupMapping(res.headers, res.rows)
    } catch (err: any) {
      toast.error(err.response?.message || err.message || 'Erro ao importar do Google Sheets')
      setStep('upload')
    }
  }

  const handleImport = async () => {
    setStep('importing')
    let successCount = 0
    const errorList: { row: number; error: string }[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const val = (k: string) =>
        mapping[k] && row[Number(mapping[k])] ? row[Number(mapping[k])].trim() : ''

      const tipoRaw = val('tipo').toUpperCase()
      const tipo = ['PF', 'PJ'].includes(tipoRaw) ? tipoRaw : 'PJ'

      const statusRaw = val('status').toLowerCase()
      const statusOptions = ['Ativo', 'Inativo', 'Lead']
      const status = statusOptions.find((o) => o.toLowerCase() === statusRaw) || 'Lead'

      const segRaw = val('segmento').toLowerCase()
      const segOptions = [
        'Educação',
        'Tecnologia',
        'Varejo',
        'Agro',
        'Indústria',
        'Serviços',
        'Cooperativa',
        'Outro',
      ]
      const segmento = segOptions.find((o) => o.toLowerCase() === segRaw) || 'Outro'

      const porteRaw = val('porte').toLowerCase()
      const porteOptions = ['Micro', 'Pequeno', 'Médio', 'Grande']
      const porte =
        porteOptions.find(
          (o) => o.toLowerCase() === porteRaw || o.toLowerCase().replace('é', 'e') === porteRaw,
        ) || 'Micro'

      let dCad = val('data_cadastro')
      if (dCad) {
        if (dCad.includes('/')) {
          const parts = dCad.split(' ')[0].split('/')
          if (parts.length === 3) {
            dCad = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString()
          }
        } else {
          const d = new Date(dCad)
          dCad = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
        }
      } else {
        dCad = new Date().toISOString()
      }

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
        const fieldErrors = extractFieldErrors(err)
        const errorMsg = Object.entries(fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(', ')
        errorList.push({
          row: i + 2,
          error: errorMsg || err.message || 'Erro ao salvar',
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
            Importe sua base de clientes a partir de arquivos CSV, Excel (.xlsx) ou Google Sheets.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="file">Arquivo Local</TabsTrigger>
              <TabsTrigger value="google">Google Sheets</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-0">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Clique ou arraste seu arquivo
                </h3>
                <p className="text-xs text-gray-500 mb-4">Suporta arquivos .csv e .xlsx</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) processFile(e.target.files[0])
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="google" className="mt-0">
              <div className="flex flex-col p-6 border rounded-lg border-gray-200 bg-gray-50 space-y-4">
                <div>
                  <Label htmlFor="googleUrl" className="mb-2 block">
                    URL da Planilha
                  </Label>
                  <Input
                    id="googleUrl"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    A planilha precisa estar com acesso público (Qualquer pessoa com o link pode
                    ler).
                  </p>
                </div>
                <Button onClick={processGoogleUrl} disabled={!googleUrl} className="w-full">
                  Carregar Dados
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Processando planilha...</p>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Relacione as colunas da sua planilha aos campos do sistema. O preview abaixo mostra
                os dados reais que serão importados.
              </p>
            </div>

            <ScrollArea className="w-full border rounded-md bg-white">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    {csvHeaders.map((header, colIndex) => {
                      const currentMappedField = Object.keys(mapping).find(
                        (k) => mapping[k] === colIndex.toString(),
                      )
                      return (
                        <TableHead
                          key={colIndex}
                          className="min-w-[220px] max-w-[250px] border-r last:border-r-0 align-top p-4"
                        >
                          <div
                            className="flex items-center gap-2 mb-3 text-gray-900 font-semibold truncate"
                            title={header || `Coluna ${colIndex + 1}`}
                          >
                            <Database className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="truncate">{header || `Coluna ${colIndex + 1}`}</span>
                          </div>
                          <Select
                            value={currentMappedField ?? 'none'}
                            onValueChange={(val) =>
                              setMapping((prev) => {
                                const n = { ...prev }
                                const oldField = Object.keys(n).find(
                                  (k) => n[k] === colIndex.toString(),
                                )
                                if (oldField) delete n[oldField]

                                if (val !== 'none') {
                                  n[val] = colIndex.toString()
                                }
                                return n
                              })
                            }
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Selecione um campo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-gray-400 italic">
                                Ignorar coluna
                              </SelectItem>
                              {TARGET_FIELDS.map((f) => (
                                <SelectItem key={f.key} value={f.key}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-gray-100/50 hover:bg-gray-100/50">
                    {csvHeaders.map((_, colIndex) => {
                      const mappedFieldKey = Object.keys(mapping).find(
                        (k) => mapping[k] === colIndex.toString(),
                      )
                      const mappedField = TARGET_FIELDS.find((f) => f.key === mappedFieldKey)
                      return (
                        <TableCell
                          key={colIndex}
                          className="border-r last:border-r-0 font-bold text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/80"
                        >
                          {mappedField ? mappedField.label : '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {Array.from({ length: Math.min(4, csvData.length) }).map((_, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-transparent">
                      {csvHeaders.map((_, colIndex) => {
                        const val = csvData[rowIdx][colIndex]
                        return (
                          <TableCell
                            key={colIndex}
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
                Voltar
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
                <h4 className="text-sm font-semibold mb-2">Detalhes dos erros:</h4>
                <ScrollArea className="h-[150px] bg-red-50 p-2 rounded-md border border-red-100">
                  <ul className="text-xs space-y-1 text-red-800 p-2">
                    {result.errors.map((e, i) => (
                      <li key={i} className="mb-2 last:mb-0">
                        <strong>Linha {e.row}:</strong> {e.error}
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

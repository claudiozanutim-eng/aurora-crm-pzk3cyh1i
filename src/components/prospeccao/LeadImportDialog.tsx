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
import { useAuth } from '@/hooks/use-auth'

const TARGET_FIELDS = [
  { key: 'nome', label: 'Nome da Empresa/Pessoa' },
  { key: 'contato_nome', label: 'Nome do Contato' },
  { key: 'email', label: 'E-mail' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'tipo', label: 'Tipo (PF/PJ)' },
  { key: 'origem', label: 'Origem' },
  { key: 'segmento', label: 'Segmento' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'status', label: 'Status' },
]

export function LeadImportDialog({
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
    created: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

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
      if (l.includes('nome') && !l.includes('contato')) autoMap.nome = String(i)
      if (l.includes('contato')) autoMap.contato_nome = String(i)
      if (l.includes('email') || l.includes('e-mail')) autoMap.email = String(i)
      if (l.includes('telefone') || l.includes('celular') || l.includes('whatsapp'))
        autoMap.telefone = String(i)
      if (l.includes('tipo')) autoMap.tipo = String(i)
      if (l.includes('origem')) autoMap.origem = String(i)
      if (l.includes('segment') || l.includes('setor')) autoMap.segmento = String(i)
      if (l.includes('prioridade')) autoMap.prioridade = String(i)
      if (l.includes('status') || l.includes('fase') || l.includes('etapa'))
        autoMap.status = String(i)
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
    let createdCount = 0
    const errorList: { row: number; error: string }[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const val = (k: string) =>
        mapping[k] && row[Number(mapping[k])] ? row[Number(mapping[k])].trim() : ''

      const nomeVal = val('nome')
      if (!nomeVal) {
        errorList.push({ row: i + 2, error: 'Nome é obrigatório' })
        continue
      }

      const tipoRaw = val('tipo').toUpperCase()
      const tipo = ['PF', 'PJ'].includes(tipoRaw) ? tipoRaw : 'PJ'

      const origemRaw = val('origem').toLowerCase()
      const origemOptions = ['Indicação', 'Site', 'Redes Sociais', 'Evento', 'Outro']
      const origem =
        origemOptions.find(
          (o) =>
            o.toLowerCase() === origemRaw ||
            o.toLowerCase().replace('ç', 'c').replace('ã', 'a') === origemRaw,
        ) || 'Outro'

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
      const segmento =
        segOptions.find(
          (o) =>
            o.toLowerCase() === segRaw ||
            o.toLowerCase().replace('ç', 'c').replace('ã', 'a') === segRaw,
        ) || 'Outro'

      const prioRaw = val('prioridade').toLowerCase()
      const prioOptions = ['Alta', 'Média', 'Baixa']
      const prioridade =
        prioOptions.find(
          (o) => o.toLowerCase() === prioRaw || o.toLowerCase().replace('é', 'e') === prioRaw,
        ) || 'Média'

      const statusRaw = val('status').toLowerCase()
      const statusOptions = [
        'Novos Leads',
        'Primeiro Contato',
        'Qualificando',
        'Não Qualificado',
        'Convertido',
      ]
      const status = statusOptions.find((o) => o.toLowerCase() === statusRaw) || 'Novos Leads'

      const recordData = {
        nome: nomeVal,
        contato_nome: val('contato_nome'),
        email: val('email'),
        telefone: val('telefone'),
        tipo,
        origem,
        segmento,
        prioridade,
        status,
        vendedor_id: user?.id,
      }

      try {
        await pb.collection('leads').create(recordData)
        createdCount++
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

    toast.success(`Importação concluída: ${createdCount} leads criados.`)
    setResult({ created: createdCount, errors: errorList })
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
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Importe sua base de leads a partir de arquivos CSV, Excel (.xlsx) ou Google Sheets.
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
                  accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                    {csvHeaders.map((header, colIndex) => (
                      <TableHead
                        key={colIndex}
                        className="min-w-[220px] max-w-[250px] border-r last:border-r-0 align-top p-4"
                      >
                        <div
                          className="flex items-center gap-2 text-gray-900 font-semibold truncate"
                          title={header || `Coluna ${colIndex + 1}`}
                        >
                          <Database className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{header || `Coluna ${colIndex + 1}`}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    {csvHeaders.map((_, colIndex) => {
                      const currentMappedField = Object.keys(mapping).find(
                        (k) => mapping[k] === colIndex.toString(),
                      )
                      return (
                        <TableHead
                          key={`select-${colIndex}`}
                          className="min-w-[220px] max-w-[250px] border-r last:border-r-0 align-top p-2"
                        >
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
            <h3 className="text-lg font-medium">Importando leads...</h3>
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
            <p className="text-center text-sm text-gray-500">
              Importação concluída: {result.created} leads criados com sucesso.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center border-y py-4 max-w-[300px] mx-auto">
              <div>
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-gray-500">Criados</div>
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

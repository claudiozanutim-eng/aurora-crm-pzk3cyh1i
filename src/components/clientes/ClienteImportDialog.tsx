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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react'
import { parseXLSX } from '@/lib/xlsx-parser'
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

interface ImportField {
  key: string
  label: string
  group: string
}

const TARGET_FIELDS: ImportField[] = [
  { key: 'tipo', label: 'Tipo (PF/PJ)', group: 'Cliente' },
  { key: 'documento', label: 'Documento (CPF/CNPJ)', group: 'Cliente' },
  { key: 'nome', label: 'Nome / Razão Social', group: 'Cliente' },
  { key: 'nome_fantasia', label: 'Nome Fantasia', group: 'Cliente' },
  { key: 'segmento', label: 'Segmento', group: 'Cliente' },
  { key: 'porte', label: 'Porte', group: 'Cliente' },
  { key: 'data_cadastro', label: 'Data de Cadastro', group: 'Cliente' },
  { key: 'data_conversao', label: 'Data de Conversão', group: 'Cliente' },
  { key: 'status', label: 'Status', group: 'Cliente' },
  { key: 'observacoes', label: 'Observações', group: 'Cliente' },
  { key: 'tags', label: 'Tags (separadas por vírgula)', group: 'Cliente' },
  { key: 'pais', label: 'País', group: 'Endereço' },
  { key: 'cep', label: 'CEP', group: 'Endereço' },
  { key: 'rua', label: 'Rua / Logradouro', group: 'Endereço' },
  { key: 'numero', label: 'Número', group: 'Endereço' },
  { key: 'complemento', label: 'Complemento', group: 'Endereço' },
  { key: 'bairro', label: 'Bairro', group: 'Endereço' },
  { key: 'cidade', label: 'Cidade', group: 'Endereço' },
  { key: 'estado', label: 'Estado', group: 'Endereço' },
  { key: 'contato_nome', label: 'Nome do Contato', group: 'Contato' },
  { key: 'contato_email', label: 'E-mail do Contato', group: 'Contato' },
  { key: 'contato_telefone', label: 'Telefone (Celular)', group: 'Contato' },
  { key: 'contato_telefone_fixo', label: 'Telefone Fixo', group: 'Contato' },
  { key: 'contato_cargo', label: 'Cargo do Contato', group: 'Contato' },
  { key: 'contato_data_aniversario', label: 'Data de Aniversário', group: 'Contato' },
  { key: 'contato_is_principal', label: 'É Contato Principal', group: 'Contato' },
]

const FIELD_GROUPS = ['Cliente', 'Endereço', 'Contato']

const SEGMENTOS = [
  'Educação',
  'Tecnologia',
  'Varejo',
  'Agro',
  'Indústria',
  'Serviços',
  'Cooperativa',
  'Outro',
]
const PORTES = ['Micro', 'Pequeno', 'Médio', 'Grande']
const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Prospect']

function parseDateToISO(value: string): string | null {
  if (!value) return null
  const v = value.trim()
  if (v.includes('/')) {
    const parts = v.split(' ')[0].split('/')
    if (parts.length >= 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00.000Z`
    }
    return null
  }
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function parseBirthdayToISO(value: string): string | null {
  if (!value) return null
  const v = value.trim()
  const parts = v.split('/')
  if (parts.length >= 2) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts.length >= 3 && parts[2].length === 4 ? parts[2] : '1900'
    return `${year}-${month}-${day}T00:00:00.000Z`
  }
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function matchSelectValue(raw: string, options: string[]): string | null {
  const lower = raw.toLowerCase().trim()
  if (!lower) return null
  const normalize = (s: string) =>
    s.toLowerCase().replace('é', 'e').replace('ç', 'c').replace('ã', 'a')
  return (
    options.find((o) => o.toLowerCase() === lower) ||
    options.find((o) => normalize(o) === lower) ||
    null
  )
}

function isValidEmail(email: string): boolean {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseBoolean(value: string): boolean {
  return ['true', 'sim', '1', 'yes', 's', 'principal'].includes(value.toLowerCase().trim())
}

function parseTags(value: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) cleaned[k] = v
  }
  return cleaned
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
  const [step, setStep] = useState<'upload' | 'loading' | 'mapping' | 'importing' | 'result'>(
    'upload',
  )
  const [googleUrl, setGoogleUrl] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{
    created: number
    updated: number
    contactsCreated: number
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
      if (l === 'tipo' || l.includes('tipo')) autoMap.tipo = String(i)
      if (l.includes('doc') || l.includes('cpf') || l.includes('cnpj'))
        autoMap.documento = String(i)
      if (l.includes('nome') && !l.includes('fantasia') && !l.includes('contato'))
        autoMap.nome = String(i)
      if (l.includes('fantasia')) autoMap.nome_fantasia = String(i)
      if (l.includes('segment')) autoMap.segmento = String(i)
      if (l.includes('porte')) autoMap.porte = String(i)
      if (l.includes('status') || l.includes('situac')) autoMap.status = String(i)
      if (l.includes('cadastro')) autoMap.data_cadastro = String(i)
      if (l.includes('conversao')) autoMap.data_conversao = String(i)
      if (l.includes('observac') || l.includes('obs')) autoMap.observacoes = String(i)
      if (l.includes('tag')) autoMap.tags = String(i)
      if (l.includes('pais') || l.includes('país')) autoMap.pais = String(i)
      if (l.includes('cep')) autoMap.cep = String(i)
      if (l.includes('rua') || l.includes('logradouro')) autoMap.rua = String(i)
      if (l.includes('numero') || l.includes('número')) autoMap.numero = String(i)
      if (l.includes('complemento')) autoMap.complemento = String(i)
      if (l.includes('bairro')) autoMap.bairro = String(i)
      if (l.includes('cidade')) autoMap.cidade = String(i)
      if (l.includes('estado') || l === 'uf') autoMap.estado = String(i)
      if ((l.includes('contato') && l.includes('nome')) || l.includes('responsavel'))
        autoMap.contato_nome = String(i)
      if (l.includes('email') || l.includes('e-mail')) autoMap.contato_email = String(i)
      if (
        (l.includes('telefone') || l.includes('celular') || l.includes('whatsapp')) &&
        !l.includes('fixo')
      )
        autoMap.contato_telefone = String(i)
      if (l.includes('fixo')) autoMap.contato_telefone_fixo = String(i)
      if (l.includes('cargo') || l.includes('funcao')) autoMap.contato_cargo = String(i)
      if (l.includes('aniversario') || l.includes('nascimento'))
        autoMap.contato_data_aniversario = String(i)
      if (l.includes('principal')) autoMap.contato_is_principal = String(i)
    })
    setMapping(autoMap)
    setStep('mapping')
  }

  const processFile = (f: File) => {
    setFile(f)
    setStep('loading')

    const isXlsx =
      f.name.toLowerCase().endsWith('.xlsx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    if (isXlsx) {
      f.arrayBuffer()
        .then(async (buffer) => {
          try {
            const result = await parseXLSX(buffer)
            if (!result.headers.length) {
              toast.error('A planilha está vazia')
              setStep('upload')
              return
            }
            setupMapping(result.headers, result.rows)
          } catch (err: any) {
            toast.error(err.message || 'Erro ao processar arquivo XLSX. Verifique o formato.')
            setStep('upload')
          }
        })
        .catch(() => {
          toast.error('Erro ao ler o arquivo XLSX.')
          setStep('upload')
        })
      return
    }

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
    let updatedCount = 0
    let contactsCreated = 0
    const errorList: { row: number; error: string }[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const val = (k: string) =>
        mapping[k] && row[Number(mapping[k])] ? row[Number(mapping[k])].trim() : ''

      const nomeVal = val('nome')
      if (!nomeVal) {
        errorList.push({ row: i + 2, error: 'Nome/Razão Social é obrigatório' })
        continue
      }

      const tipoRaw = val('tipo').toUpperCase()
      const tipo = ['PF', 'PJ'].includes(tipoRaw) ? tipoRaw : 'PJ'

      const status = matchSelectValue(val('status'), STATUS_OPTIONS) || 'Prospect'
      const segmento = matchSelectValue(val('segmento'), SEGMENTOS) || 'Outro'
      const porte = matchSelectValue(val('porte'), PORTES) || 'Micro'

      let dCad = parseDateToISO(val('data_cadastro'))
      if (!dCad) dCad = new Date().toISOString()
      const dConv = parseDateToISO(val('data_conversao'))

      const contatoEmail = val('contato_email')
      if (contatoEmail && !isValidEmail(contatoEmail)) {
        errorList.push({ row: i + 2, error: `E-mail do contato inválido: "${contatoEmail}"` })
        continue
      }

      const tags = parseTags(val('tags'))

      const clienteData = cleanUndefined({
        tipo,
        documento: val('documento') || undefined,
        nome: nomeVal,
        nome_fantasia: val('nome_fantasia') || undefined,
        segmento,
        porte,
        status,
        data_cadastro: dCad,
        data_conversao: dConv || undefined,
        observacoes: val('observacoes') || undefined,
        tags: tags.length > 0 ? tags : undefined,
        pais: val('pais') || 'Brasil',
        cep: val('cep') || undefined,
        rua: val('rua') || undefined,
        numero: val('numero') || undefined,
        complemento: val('complemento') || undefined,
        bairro: val('bairro') || undefined,
        cidade: val('cidade') || undefined,
        estado: val('estado') || undefined,
      })

      try {
        let existingClient: any = null
        const docVal = val('documento')

        if (docVal) {
          try {
            existingClient = await pb
              .collection('clientes')
              .getFirstListItem(`documento="${docVal.replace(/"/g, '\\"')}"`)
          } catch {
            /* not found */
          }
        }

        if (!existingClient) {
          try {
            existingClient = await pb
              .collection('clientes')
              .getFirstListItem(`nome="${nomeVal.replace(/"/g, '\\"')}"`)
          } catch {
            /* not found */
          }
        }

        let clientId: string

        if (existingClient) {
          await pb.collection('clientes').update(existingClient.id, clienteData)
          updatedCount++
          clientId = existingClient.id
        } else {
          const newClient = await pb.collection('clientes').create(clienteData)
          createdCount++
          clientId = newClient.id
        }

        const contatoNome = val('contato_nome')
        const hasContactData =
          contatoNome ||
          contatoEmail ||
          val('contato_telefone') ||
          val('contato_telefone_fixo') ||
          val('contato_cargo') ||
          val('contato_data_aniversario')

        if (hasContactData) {
          const birthday = parseBirthdayToISO(val('contato_data_aniversario'))
          const contatoData = cleanUndefined({
            nome: contatoNome || nomeVal,
            email: contatoEmail || undefined,
            telefone: val('contato_telefone') || undefined,
            telefone_fixo: val('contato_telefone_fixo') || undefined,
            cargo: val('contato_cargo') || undefined,
            cliente_id: clientId,
            is_principal: val('contato_is_principal')
              ? parseBoolean(val('contato_is_principal'))
              : false,
            data_aniversario: birthday || undefined,
          })

          try {
            await pb.collection('contatos').create(contatoData)
            contactsCreated++
          } catch (contactErr: any) {
            const fieldErrors = extractFieldErrors(contactErr)
            const errorMsg = Object.entries(fieldErrors)
              .map(([f, m]) => `${f}: ${m}`)
              .join(', ')
            errorList.push({
              row: i + 2,
              error: `Cliente salvo, mas erro ao criar contato: ${errorMsg || contactErr.message}`,
            })
          }
        }
      } catch (err: any) {
        const fieldErrors = extractFieldErrors(err)
        const errorMsg = Object.entries(fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(', ')
        errorList.push({ row: i + 2, error: errorMsg || err.message || 'Erro ao salvar' })
      }
    }

    toast.success(
      `Importação concluída: ${createdCount} novos clientes, ${updatedCount} atualizados e ${contactsCreated} contatos criados.`,
    )
    setResult({ created: createdCount, updated: updatedCount, contactsCreated, errors: errorList })
    setStep('result')
    onSuccess()
  }

  const renderMappingSelect = (colIndex: number) => {
    const currentMappedField = Object.keys(mapping).find((k) => mapping[k] === colIndex.toString())
    return (
      <Select
        value={currentMappedField ?? 'none'}
        onValueChange={(val) =>
          setMapping((prev) => {
            const n = { ...prev }
            const oldField = Object.keys(n).find((k) => n[k] === colIndex.toString())
            if (oldField) delete n[oldField]
            if (val !== 'none') n[val] = colIndex.toString()
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
          {FIELD_GROUPS.map((group) => (
            <SelectGroup key={group}>
              <SelectLabel className="font-semibold text-gray-700">{group}</SelectLabel>
              {TARGET_FIELDS.filter((f) => f.group === group).map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    )
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
          <DialogTitle>Importar Clientes e Contatos</DialogTitle>
          <DialogDescription>
            Importe sua base de clientes com contatos e endereços a partir de CSV, Excel (.xlsx) ou
            Google Sheets.
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
                Relacione as colunas da sua planilha aos campos do sistema. Campos de Cliente,
                Endereço e Contato estão disponíveis. Se houver dados de contato, um registro será
                criado e vinculado automaticamente ao cliente.
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
                    {csvHeaders.map((_, colIndex) => (
                      <TableHead
                        key={`select-${colIndex}`}
                        className="min-w-[220px] max-w-[250px] border-r last:border-r-0 align-top p-2"
                      >
                        {renderMappingSelect(colIndex)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: Math.min(4, csvData.length) }).map((_, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-transparent">
                      {csvHeaders.map((_, colIndex) => {
                        const cellVal = csvData[rowIdx][colIndex]
                        return (
                          <TableCell
                            key={colIndex}
                            className="border-r last:border-r-0 text-sm text-gray-600"
                          >
                            <div className="truncate max-w-[200px]" title={cellVal}>
                              {cellVal || <span className="text-gray-300 italic">vazio</span>}
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
              <Button
                onClick={handleImport}
                className="bg-[#e55320] hover:bg-[#e55320]/90 text-white"
              >
                Iniciar Importação
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <h3 className="text-lg font-medium">Importando clientes e contatos...</h3>
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
              {result.created} novos clientes criados, {result.updated} clientes atualizados e{' '}
              {result.contactsCreated} contatos criados.
            </p>
            <div className="grid grid-cols-4 gap-4 text-center border-y py-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-gray-500">Clientes Criados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-sm text-gray-500">Atualizados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{result.contactsCreated}</div>
                <div className="text-sm text-gray-500">Contatos Criados</div>
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

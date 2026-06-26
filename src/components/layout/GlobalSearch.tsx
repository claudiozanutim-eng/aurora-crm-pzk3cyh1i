import { Search, Loader2, Building, UserSquare, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import pb from '@/lib/pocketbase/client'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebounce(term, 300)

  const [results, setResults] = useState<{ clientes: any[]; leads: any[]; negocios: any[] }>({
    clientes: [],
    leads: [],
    negocios: [],
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (debouncedTerm.length >= 3) {
      setLoading(true)
      const t = debouncedTerm.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      Promise.all([
        pb
          .collection('clientes')
          .getList(1, 5, {
            filter: `nome ~ "${t}" || nome_fantasia ~ "${t}" || documento ~ "${t}"`,
          }),
        pb.collection('leads').getList(1, 5, { filter: `nome ~ "${t}" || contato_nome ~ "${t}"` }),
        pb
          .collection('negocios')
          .getList(1, 5, {
            filter: `descricao ~ "${t}" || cliente_id.nome ~ "${t}"`,
            expand: 'cliente_id',
          }),
      ])
        .then(([c, l, n]) => {
          setResults({ clientes: c.items, leads: l.items, negocios: n.items })
          setOpen(true)
        })
        .catch((err) => {
          console.error('Search error', err)
        })
        .finally(() => setLoading(false))
    } else {
      setResults({ clientes: [], leads: [], negocios: [] })
      setOpen(false)
    }
  }, [debouncedTerm])

  const hasResults =
    results.clientes.length > 0 || results.leads.length > 0 || results.negocios.length > 0

  const handleSelect = (path: string) => {
    navigate(path)
    setOpen(false)
    setTerm('')
  }

  return (
    <form className="ml-auto flex-1 sm:flex-initial" onSubmit={(e) => e.preventDefault()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Buscar em todo o CRM..."
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                if (e.target.value.length < 3) setOpen(false)
              }}
              onFocus={() => {
                if (term.length >= 3) setOpen(true)
              }}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-primary focus-visible:border-primary transition-all rounded-full"
            />
            {loading && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-[350px] p-0 shadow-lg border rounded-xl overflow-hidden"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="max-h-[60vh]">
            {!hasResults && !loading && term.length >= 3 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhum resultado encontrado para "{term}"
              </div>
            )}

            <div className="flex flex-col py-2">
              {results.clientes.length > 0 && (
                <div className="px-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    Clientes
                  </div>
                  {results.clientes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/clientes/${c.id}`)}
                      className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="font-medium truncate">{c.nome}</div>
                      {(c.nome_fantasia || c.documento) && (
                        <div className="text-xs text-gray-500 truncate">
                          {[c.nome_fantasia, c.documento].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.leads.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <UserSquare className="h-3 w-3" />
                    Leads
                  </div>
                  {results.leads.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleSelect(`/leads/${l.id}`)}
                      className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="font-medium truncate">{l.nome}</div>
                      {l.contato_nome && (
                        <div className="text-xs text-gray-500 truncate">
                          Contato: {l.contato_nome}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.negocios.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Negócios
                  </div>
                  {results.negocios.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSelect(`/clientes/${n.cliente_id}`)}
                      className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="font-medium truncate">
                        {n.descricao || 'Negócio sem descrição'}
                      </div>
                      {n.expand?.cliente_id && (
                        <div className="text-xs text-gray-500 truncate">
                          Cliente: {n.expand.cliente_id.nome}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </form>
  )
}

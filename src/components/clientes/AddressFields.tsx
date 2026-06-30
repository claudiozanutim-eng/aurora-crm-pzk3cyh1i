import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export interface AddressValues {
  pais: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

const UF_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

const UF_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

interface AddressFieldsProps {
  values: AddressValues
  onChange: (field: keyof AddressValues, value: string) => void
}

export function AddressFields({ values, onChange }: AddressFieldsProps) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')

  const isBrasil = (values.pais || 'Brasil') === 'Brasil'

  const handleCepChange = useCallback(
    async (rawCep: string) => {
      const digits = rawCep.replace(/\D/g, '').slice(0, 8)
      const masked = digits.replace(/(\d{5})(\d)/, '$1-$2')
      onChange('cep', masked)
      setCepError('')

      if (!isBrasil || digits.length !== 8) return

      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (data.erro) {
          setCepError('CEP não encontrado')
          return
        }
        onChange('rua', data.logradouro || '')
        onChange('bairro', data.bairro || '')
        onChange('cidade', data.localidade || '')
        onChange('estado', data.uf || '')
        onChange('complemento', data.complemento || '')
      } catch {
        setCepError('Erro ao buscar CEP')
      } finally {
        setCepLoading(false)
      }
    },
    [isBrasil, onChange],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pais">País</Label>
          <Input
            id="pais"
            value={values.pais || 'Brasil'}
            onChange={(e) => onChange('pais', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">{isBrasil ? 'CEP' : 'Código Postal'}</Label>
          <div className="relative">
            <Input
              id="cep"
              value={values.cep || ''}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder={isBrasil ? '00000-000' : 'Código postal'}
            />
            {cepLoading && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          {cepError && <span className="text-sm text-red-500">{cepError}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="rua">Rua / Logradouro</Label>
          <Input
            id="rua"
            value={values.rua || ''}
            onChange={(e) => onChange('rua', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={values.numero || ''}
            onChange={(e) => onChange('numero', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={values.complemento || ''}
            onChange={(e) => onChange('complemento', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            value={values.bairro || ''}
            onChange={(e) => onChange('bairro', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={values.cidade || ''}
            onChange={(e) => onChange('cidade', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          {isBrasil ? (
            <Select
              value={values.estado || undefined}
              onValueChange={(val) => onChange('estado', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UF_STATES.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf} - {UF_NAMES[uf]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={values.estado || ''}
              onChange={(e) => onChange('estado', e.target.value)}
              placeholder="Estado / Província / Região"
            />
          )}
        </div>
      </div>
    </div>
  )
}

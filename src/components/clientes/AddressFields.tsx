import { useState } from 'react'
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

const BRAZILIAN_STATES = [
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

interface AddressFieldsProps {
  values: AddressValues
  onChange: (field: keyof AddressValues, value: string) => void
}

function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

export function AddressFields({ values, onChange }: AddressFieldsProps) {
  const [loadingCep, setLoadingCep] = useState(false)
  const isBrazil = values.pais === 'Brasil'

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        onChange('rua', data.logradouro || '')
        onChange('bairro', data.bairro || '')
        onChange('cidade', data.localidade || '')
        onChange('estado', data.uf || '')
      }
    } catch {
      // silently fail — user can type manually
    } finally {
      setLoadingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    const masked = maskCEP(value)
    onChange('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) {
      handleCepLookup(masked)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          value={values.pais}
          onChange={(e) => onChange('pais', e.target.value)}
          placeholder="Brasil"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="relative">
            <Input
              id="cep"
              value={values.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              inputMode="numeric"
              disabled={loadingCep}
            />
            {loadingCep && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={values.numero}
            onChange={(e) => onChange('numero', e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rua">Rua / Logradouro</Label>
        <Input
          id="rua"
          value={values.rua}
          onChange={(e) => onChange('rua', e.target.value)}
          placeholder="Rua Exemplo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="complemento">Complemento</Label>
        <Input
          id="complemento"
          value={values.complemento}
          onChange={(e) => onChange('complemento', e.target.value)}
          placeholder="Sala 1, Andar 2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bairro">Bairro</Label>
        <Input
          id="bairro"
          value={values.bairro}
          onChange={(e) => onChange('bairro', e.target.value)}
          placeholder="Centro"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={values.cidade}
            onChange={(e) => onChange('cidade', e.target.value)}
            placeholder="São Paulo"
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          {isBrazil ? (
            <Select
              value={values.estado || undefined}
              onValueChange={(val) => onChange('estado', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={values.estado}
              onChange={(e) => onChange('estado', e.target.value)}
              placeholder="Estado"
            />
          )}
        </div>
      </div>
    </div>
  )
}

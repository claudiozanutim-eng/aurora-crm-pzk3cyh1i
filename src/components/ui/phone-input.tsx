import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRY_CODES, parsePhone, formatPhone, type CountryCode } from '@/lib/country-codes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find((c) => c.iso3 === 'BRA') || COUNTRY_CODES[0],
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wasInternalChange = useRef(false)

  useEffect(() => {
    if (wasInternalChange.current) {
      wasInternalChange.current = false
      return
    }
    if (!value) {
      setPhoneNumber('')
      return
    }
    const parsed = parsePhone(value)
    const country = COUNTRY_CODES.find((c) => c.ddi === parsed.ddi)
    if (country) {
      setSelectedCountry(country)
    }
    setPhoneNumber(parsed.number)
  }, [value])

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setOpen(false)
    setSearch('')
    const newValue = formatPhone(country.ddi, phoneNumber)
    wasInternalChange.current = true
    onChange(newValue)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value
    setPhoneNumber(newPhone)
    const newValue = formatPhone(selectedCountry.ddi, newPhone)
    wasInternalChange.current = true
    onChange(newValue)
  }

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ddi.includes(search) ||
      c.iso3.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={cn('flex w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-background px-2 py-2 text-sm hover:bg-accent shrink-0"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.ddi}</span>
            <span className="text-xs text-muted-foreground uppercase">{selectedCountry.iso3}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Buscar país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.iso3}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="text-xs text-muted-foreground">{country.ddi}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        ref={inputRef}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder || '99999-9999'}
        className="rounded-l-none flex-1 min-w-[120px]"
      />
    </div>
  )
}

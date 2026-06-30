export interface CountryCode {
  name: string
  ddi: string
  iso3: string
  flag: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'Brasil', ddi: '+55', iso3: 'BRA', flag: '🇧🇷' },
  { name: 'Estados Unidos', ddi: '+1', iso3: 'USA', flag: '🇺🇸' },
  { name: 'Canadá', ddi: '+1', iso3: 'CAN', flag: '🇨🇦' },
  { name: 'Argentina', ddi: '+54', iso3: 'ARG', flag: '🇦🇷' },
  { name: 'Chile', ddi: '+56', iso3: 'CHL', flag: '🇨🇱' },
  { name: 'Uruguai', ddi: '+598', iso3: 'URY', flag: '🇺🇾' },
  { name: 'Paraguai', ddi: '+595', iso3: 'PRY', flag: '🇵🇾' },
  { name: 'Bolívia', ddi: '+591', iso3: 'BOL', flag: '🇧🇴' },
  { name: 'Peru', ddi: '+51', iso3: 'PER', flag: '🇵🇪' },
  { name: 'Colômbia', ddi: '+57', iso3: 'COL', flag: '🇨🇴' },
  { name: 'Venezuela', ddi: '+58', iso3: 'VEN', flag: '🇻🇪' },
  { name: 'Equador', ddi: '+593', iso3: 'ECU', flag: '🇪🇨' },
  { name: 'México', ddi: '+52', iso3: 'MEX', flag: '🇲🇽' },
  { name: 'Portugal', ddi: '+351', iso3: 'PRT', flag: '🇵🇹' },
  { name: 'Espanha', ddi: '+34', iso3: 'ESP', flag: '🇪🇸' },
  { name: 'França', ddi: '+33', iso3: 'FRA', flag: '🇫🇷' },
  { name: 'Reino Unido', ddi: '+44', iso3: 'GBR', flag: '🇬🇧' },
  { name: 'Alemanha', ddi: '+49', iso3: 'DEU', flag: '🇩🇪' },
  { name: 'Itália', ddi: '+39', iso3: 'ITA', flag: '🇮🇹' },
  { name: 'Holanda', ddi: '+31', iso3: 'NLD', flag: '🇳🇱' },
  { name: 'Bélgica', ddi: '+32', iso3: 'BEL', flag: '🇧🇪' },
  { name: 'Suíça', ddi: '+41', iso3: 'CHE', flag: '🇨🇭' },
  { name: 'Áustria', ddi: '+43', iso3: 'AUT', flag: '🇦🇹' },
  { name: 'Suécia', ddi: '+46', iso3: 'SWE', flag: '🇸🇪' },
  { name: 'Noruega', ddi: '+47', iso3: 'NOR', flag: '🇳🇴' },
  { name: 'Dinamarca', ddi: '+45', iso3: 'DNK', flag: '🇩🇰' },
  { name: 'Finlândia', ddi: '+358', iso3: 'FIN', flag: '🇫🇮' },
  { name: 'Irlanda', ddi: '+353', iso3: 'IRL', flag: '🇮🇪' },
  { name: 'Rússia', ddi: '+7', iso3: 'RUS', flag: '🇷🇺' },
  { name: 'Polônia', ddi: '+48', iso3: 'POL', flag: '🇵🇱' },
  { name: 'Grécia', ddi: '+30', iso3: 'GRC', flag: '🇬🇷' },
  { name: 'Japão', ddi: '+81', iso3: 'JPN', flag: '🇯🇵' },
  { name: 'China', ddi: '+86', iso3: 'CHN', flag: '🇨🇳' },
  { name: 'Coreia do Sul', ddi: '+82', iso3: 'KOR', flag: '🇰🇷' },
  { name: 'Índia', ddi: '+91', iso3: 'IND', flag: '🇮🇳' },
  { name: 'Indonésia', ddi: '+62', iso3: 'IDN', flag: '🇮🇩' },
  { name: 'Tailândia', ddi: '+66', iso3: 'THA', flag: '🇹🇭' },
  { name: 'Vietnã', ddi: '+84', iso3: 'VNM', flag: '🇻🇳' },
  { name: 'Filipinas', ddi: '+63', iso3: 'PHL', flag: '🇵🇭' },
  { name: 'Malásia', ddi: '+60', iso3: 'MYS', flag: '🇲🇾' },
  { name: 'Singapura', ddi: '+65', iso3: 'SGP', flag: '🇸🇬' },
  { name: 'Hong Kong', ddi: '+852', iso3: 'HKG', flag: '🇭🇰' },
  { name: 'Taiwan', ddi: '+886', iso3: 'TWN', flag: '🇹🇼' },
  { name: 'Israel', ddi: '+972', iso3: 'ISR', flag: '🇮🇱' },
  { name: 'Emirados Árabes', ddi: '+971', iso3: 'ARE', flag: '🇦🇪' },
  { name: 'Arábia Saudita', ddi: '+966', iso3: 'SAU', flag: '🇸🇦' },
  { name: 'Turquia', ddi: '+90', iso3: 'TUR', flag: '🇹🇷' },
  { name: 'África do Sul', ddi: '+27', iso3: 'ZAF', flag: '🇿🇦' },
  { name: 'Egito', ddi: '+20', iso3: 'EGY', flag: '🇪🇬' },
  { name: 'Nigéria', ddi: '+234', iso3: 'NGA', flag: '🇳🇬' },
  { name: 'Marrocos', ddi: '+212', iso3: 'MAR', flag: '🇲🇦' },
  { name: 'Austrália', ddi: '+61', iso3: 'AUS', flag: '🇦🇺' },
  { name: 'Nova Zelândia', ddi: '+64', iso3: 'NZL', flag: '🇳🇿' },
  { name: 'Cuba', ddi: '+53', iso3: 'CUB', flag: '🇨🇺' },
  { name: 'Costa Rica', ddi: '+506', iso3: 'CRI', flag: '🇨🇷' },
  { name: 'Panamá', ddi: '+507', iso3: 'PAN', flag: '🇵🇦' },
  { name: 'Guatemala', ddi: '+502', iso3: 'GTM', flag: '🇬🇹' },
  { name: 'República Dominicana', ddi: '+1', iso3: 'DOM', flag: '🇩🇴' },
  { name: 'Angola', ddi: '+244', iso3: 'AGO', flag: '🇦🇴' },
  { name: 'Moçambique', ddi: '+258', iso3: 'MOZ', flag: '🇲🇿' },
  { name: 'Cabo Verde', ddi: '+238', iso3: 'CPV', flag: '🇨🇻' },
]

export function parsePhone(stored: string): { ddi: string; number: string } {
  if (!stored || !stored.trim()) {
    return { ddi: '+55', number: '' }
  }
  const trimmed = stored.trim()
  if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.ddi.length - a.ddi.length)
    for (const country of sorted) {
      if (trimmed.startsWith(country.ddi)) {
        return { ddi: country.ddi, number: trimmed.slice(country.ddi.length).trim() }
      }
    }
    return { ddi: '+55', number: trimmed }
  }
  return { ddi: '+55', number: trimmed.replace(/\D/g, '') }
}

export function formatPhone(ddi: string, number: string): string {
  const cleanNumber = number.trim()
  if (!cleanNumber) return ''
  return `${ddi} ${cleanNumber}`
}

// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/spreadsheet/parse',
  (e) => {
    const { read, utils } = require('xlsx')
    const body = e.requestInfo().body
    const base64 = body.base64

    if (!base64) return e.badRequestError('missing base64 content')

    try {
      const workbook = read(base64, { type: 'base64' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      const data = utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' })

      if (!data || data.length === 0 || (data.length === 1 && data[0].length === 0)) {
        return e.badRequestError('A planilha está vazia')
      }

      const headers = data[0].map((h) => String(h).trim())

      const numCols = headers.length

      const rows = data
        .slice(1)
        .map((row) => {
          const normalizedRow = []
          for (let i = 0; i < numCols; i++) {
            normalizedRow.push(String(row[i] || '').trim())
          }
          return normalizedRow
        })
        .filter((row) => row.some((cell) => cell !== ''))

      return e.json(200, { headers, rows })
    } catch (err) {
      return e.badRequestError('Arquivo inválido: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

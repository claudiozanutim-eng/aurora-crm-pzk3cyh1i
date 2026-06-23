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
      const wb = read(base64, { type: 'base64' })
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      const data = utils.sheet_to_json(sheet, { header: 1, defval: '' })

      if (data.length === 0) return e.badRequestError('A planilha está vazia')

      const headers = data[0].map((h) => String(h))
      const rows = data
        .slice(1)
        .map((row) => row.map((cell) => String(cell)))
        .filter((row) => row.some((cell) => cell.trim() !== ''))

      return e.json(200, { headers, rows })
    } catch (err) {
      return e.badRequestError('Arquivo de planilha inválido: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/spreadsheet/google',
  (e) => {
    const { read, utils } = require('xlsx')
    const body = e.requestInfo().body
    const url = body.url

    if (!url) return e.badRequestError('missing url')

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) return e.badRequestError('URL do Google Sheets inválida')

    const exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`

    try {
      const res = $http.send({ url: exportUrl, method: 'GET', timeout: 30 })
      if (res.statusCode !== 200) {
        return e.badRequestError('Falha ao buscar planilha. Verifique se o link está público.')
      }

      const text = new TextDecoder().decode(res.body)
      const wb = read(text, { type: 'string' })
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
      return e.badRequestError('Erro ao processar Google Sheet: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

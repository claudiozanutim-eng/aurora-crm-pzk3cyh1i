routerAdd(
  'POST',
  '/backend/v1/spreadsheet/google',
  (e) => {
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

      let text = ''
      if (typeof res.body === 'string') {
        text = res.body
      } else {
        try {
          text = new TextDecoder().decode(res.body)
        } catch (err) {
          if (res.body) {
            text = new TextDecoder().decode(new Uint8Array(res.body))
          }
        }
      }

      function parseCSV(str) {
        var arr = []
        var quote = false
        var row = 0
        var col = 0
        var sep = ','
        var firstLine = str.split('\n')[0] || ''
        var commaCount = (firstLine.match(/,/g) || []).length
        var semiCount = (firstLine.match(/;/g) || []).length
        if (semiCount > commaCount) {
          sep = ';'
        }

        for (var c = 0; c < str.length; c++) {
          var cc = str[c],
            nc = str[c + 1]
          arr[row] = arr[row] || []
          arr[row][col] = arr[row][col] || ''
          if (cc == '"' && quote && nc == '"') {
            arr[row][col] += cc
            ++c
            continue
          }
          if (cc == '"') {
            quote = !quote
            continue
          }
          if (cc == sep && !quote) {
            ++col
            continue
          }
          if (cc == '\r' && nc == '\n' && !quote) {
            ++row
            col = 0
            ++c
            continue
          }
          if (cc == '\n' && !quote) {
            ++row
            col = 0
            continue
          }
          if (cc == '\r' && !quote) {
            ++row
            col = 0
            continue
          }
          arr[row][col] += cc
        }
        return arr
      }

      const data = parseCSV(text)

      if (data.length === 0 || (data.length === 1 && data[0].length === 0))
        return e.badRequestError('A planilha está vazia')

      const headers = data[0].map((h) => String(h).trim())
      const rows = data
        .slice(1)
        .map((row) => row.map((cell) => String(cell).trim()))
        .filter((row) => row.some((cell) => cell !== ''))

      return e.json(200, { headers, rows })
    } catch (err) {
      return e.badRequestError('Erro ao processar Google Sheet: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

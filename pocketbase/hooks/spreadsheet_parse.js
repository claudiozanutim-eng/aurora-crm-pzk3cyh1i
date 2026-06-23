routerAdd(
  'POST',
  '/backend/v1/spreadsheet/parse',
  (e) => {
    const body = e.requestInfo().body
    const base64 = body.base64

    if (!base64) return e.badRequestError('missing base64 content')

    try {
      const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const b64map = {}
      for (let i = 0; i < b64.length; i++) b64map[b64[i]] = i

      let bytes = []
      let str = base64.replace(/[^A-Za-z0-9\+\/]/g, '')
      for (let i = 0; i < str.length; i += 4) {
        let c1 = b64map[str[i]],
          c2 = b64map[str[i + 1]],
          c3 = b64map[str[i + 2]] || 0,
          c4 = b64map[str[i + 3]] || 0
        bytes.push((c1 << 2) | (c2 >> 4))
        if (str[i + 2] !== undefined && str[i + 2] !== '=') bytes.push(((c2 & 15) << 4) | (c3 >> 2))
        if (str[i + 3] !== undefined && str[i + 3] !== '=') bytes.push(((c3 & 3) << 6) | c4)
      }

      if (
        bytes.length > 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      ) {
        return e.badRequestError(
          'Formato XLSX não suportado no momento. Por favor, converta para CSV e tente novamente.',
        )
      }

      let start = 0
      if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        start = 3
      }

      let text = ''
      for (let i = start; i < bytes.length; i++) {
        let c = bytes[i]
        if (c < 128) {
          text += String.fromCharCode(c)
        } else if (c > 191 && c < 224) {
          text += String.fromCharCode(((c & 31) << 6) | (bytes[i + 1] & 63))
          i++
        } else if (c > 223 && c < 240) {
          text += String.fromCharCode(
            ((c & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63),
          )
          i += 2
        } else if (c > 239 && c < 248) {
          let codepoint =
            ((c & 7) << 18) |
            ((bytes[i + 1] & 63) << 12) |
            ((bytes[i + 2] & 63) << 6) |
            (bytes[i + 3] & 63)
          codepoint -= 0x10000
          text += String.fromCharCode((codepoint >> 10) + 0xd800, (codepoint & 0x3ff) + 0xdc00)
          i += 3
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
      return e.badRequestError('Arquivo inválido: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

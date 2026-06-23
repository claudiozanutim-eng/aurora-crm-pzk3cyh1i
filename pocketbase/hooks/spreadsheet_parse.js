routerAdd(
  'POST',
  '/backend/v1/spreadsheet/parse',
  (e) => {
    const body = e.requestInfo().body
    const base64 = body.base64

    if (!base64) return e.badRequestError('missing base64 content')

    if (base64.startsWith('UEsD')) {
      return e.badRequestError(
        'Arquivos XLSX não são suportados. Por favor, salve a planilha como CSV e tente novamente.',
      )
    }

    try {
      const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const b64tab = {}
      for (let i = 0; i < b64chars.length; i++) b64tab[b64chars[i]] = i

      let binary = ''
      const base64Clean = base64.replace(/[^A-Za-z0-9+/=]/g, '')
      for (let i = 0; i < base64Clean.length; i += 4) {
        const n1 = b64tab[base64Clean[i]]
        const n2 = b64tab[base64Clean[i + 1]]
        const n3 = base64Clean[i + 2] !== '=' ? b64tab[base64Clean[i + 2]] : 0
        const n4 = base64Clean[i + 3] !== '=' ? b64tab[base64Clean[i + 3]] : 0

        binary += String.fromCharCode((n1 << 2) | (n2 >> 4))
        if (base64Clean[i + 2] !== '=') binary += String.fromCharCode(((n2 & 15) << 4) | (n3 >> 2))
        if (base64Clean[i + 3] !== '=') binary += String.fromCharCode(((n3 & 3) << 6) | n4)
      }

      let decoded = ''
      let isUtf8 = true
      try {
        for (let i = 0; i < binary.length; ) {
          let c = binary.charCodeAt(i)
          if (c < 128) {
            decoded += String.fromCharCode(c)
            i++
          } else if (c > 191 && c < 224) {
            if (i + 1 >= binary.length) {
              isUtf8 = false
              break
            }
            let c2 = binary.charCodeAt(i + 1)
            decoded += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
            i += 2
          } else if (c >= 224 && c < 240) {
            if (i + 2 >= binary.length) {
              isUtf8 = false
              break
            }
            let c2 = binary.charCodeAt(i + 1)
            let c3 = binary.charCodeAt(i + 2)
            decoded += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
            i += 3
          } else {
            isUtf8 = false
            break
          }
        }
      } catch (err) {
        isUtf8 = false
      }

      if (!isUtf8) {
        decoded = binary
      }

      const rowsRaw = []
      let currentRow = []
      let currentCell = ''
      let inQuotes = false

      for (let i = 0; i < decoded.length; i++) {
        const c = decoded[i]
        const nextC = decoded[i + 1]

        if (c === '"') {
          if (inQuotes && nextC === '"') {
            currentCell += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if ((c === ',' || c === ';') && !inQuotes) {
          currentRow.push(currentCell.trim())
          currentCell = ''
        } else if (c === '\n' && !inQuotes) {
          currentRow.push(currentCell.trim())
          rowsRaw.push(currentRow)
          currentRow = []
          currentCell = ''
        } else if (c === '\r' && !inQuotes) {
          // ignore
        } else {
          currentCell += c
        }
      }

      if (currentCell !== '' || currentRow.length > 0) {
        currentRow.push(currentCell.trim())
        rowsRaw.push(currentRow)
      }

      if (!rowsRaw || rowsRaw.length === 0 || (rowsRaw.length === 1 && rowsRaw[0].length === 0)) {
        return e.badRequestError('A planilha está vazia')
      }

      const headers = rowsRaw[0].map((h) => String(h).trim())
      const numCols = headers.length

      const rows = rowsRaw
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

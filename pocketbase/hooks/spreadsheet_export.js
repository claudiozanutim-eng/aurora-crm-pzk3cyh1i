routerAdd(
  'POST',
  '/backend/v1/spreadsheet/export',
  (e) => {
    const body = e.requestInfo().body

    if (!body.data || !Array.isArray(body.data)) {
      return e.badRequestError('missing data array')
    }

    try {
      const escapeCSV = (val) => {
        if (val == null) return ''
        const str = String(val)
        if (
          str.includes(',') ||
          str.includes(';') ||
          str.includes('"') ||
          str.includes('\n') ||
          str.includes('\r')
        ) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      }

      const csvData = body.data.map((row) => row.map(escapeCSV).join(';')).join('\r\n')

      let utf8 = []
      utf8.push(0xef, 0xbb, 0xbf)
      for (let i = 0; i < csvData.length; i++) {
        let charcode = csvData.charCodeAt(i)
        if (charcode < 0x80) utf8.push(charcode)
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(
            0xe0 | (charcode >> 12),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f),
          )
        } else {
          i++
          charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (csvData.charCodeAt(i) & 0x3ff))
          utf8.push(
            0xf0 | (charcode >> 18),
            0x80 | ((charcode >> 12) & 0x3f),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f),
          )
        }
      }

      const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let base64 = ''
      for (let i = 0; i < utf8.length; i += 3) {
        const c1 = utf8[i]
        const c2 = i + 1 < utf8.length ? utf8[i + 1] : 0
        const c3 = i + 2 < utf8.length ? utf8[i + 2] : 0
        const a = c1 >> 2
        const b = ((c1 & 3) << 4) | (c2 >> 4)
        const c = ((c2 & 15) << 2) | (c3 >> 6)
        const d = c3 & 63
        base64 +=
          b64[a] +
          b64[b] +
          (i + 1 < utf8.length ? b64[c] : '=') +
          (i + 2 < utf8.length ? b64[d] : '=')
      }

      return e.json(200, { base64 })
    } catch (err) {
      return e.badRequestError('Exportação falhou: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

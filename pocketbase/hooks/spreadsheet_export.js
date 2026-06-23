routerAdd(
  'POST',
  '/backend/v1/spreadsheet/export',
  (e) => {
    const body = e.requestInfo().body

    if (!body.data || !Array.isArray(body.data)) {
      return e.badRequestError('missing data array')
    }

    try {
      function escapeXml(unsafe) {
        if (unsafe === null || unsafe === undefined) return ''
        return String(unsafe).replace(/[<>&'"]/g, function (c) {
          switch (c) {
            case '<':
              return '&lt;'
            case '>':
              return '&gt;'
            case '&':
              return '&amp;'
            case "'":
              return '&apos;'
            case '"':
              return '&quot;'
          }
        })
      }

      let sheet1 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      sheet1 += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n'
      sheet1 += '  <sheetData>\n'

      body.data.forEach((row) => {
        sheet1 += '    <row>\n'
        row.forEach((cell) => {
          if (cell === null || cell === undefined || cell === '') {
            sheet1 += '      <c></c>\n'
          } else if (typeof cell === 'number') {
            sheet1 += '      <c><v>' + cell + '</v></c>\n'
          } else if (typeof cell === 'boolean') {
            sheet1 += '      <c t="b"><v>' + (cell ? '1' : '0') + '</v></c>\n'
          } else {
            sheet1 += '      <c t="inlineStr"><is><t>' + escapeXml(cell) + '</t></is></c>\n'
          }
        })
        sheet1 += '    </row>\n'
      })

      sheet1 += '  </sheetData>\n</worksheet>'

      const contentTypes =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
        '  <Default Extension="xml" ContentType="application/xml"/>\n' +
        '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n' +
        '  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n' +
        '</Types>'

      const rels =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n' +
        '</Relationships>'

      const workbook =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n' +
        '  <sheets>\n' +
        '    <sheet name="Planilha1" sheetId="1" r:id="rId1"/>\n' +
        '  </sheets>\n' +
        '</workbook>'

      const workbookRels =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n' +
        '</Relationships>'

      const files = [
        { name: '[Content_Types].xml', data: contentTypes },
        { name: '_rels/.rels', data: rels },
        { name: 'xl/workbook.xml', data: workbook },
        { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
        { name: 'xl/worksheets/sheet1.xml', data: sheet1 },
      ]

      function strToBytes(str) {
        let utf8 = []
        for (let i = 0; i < str.length; i++) {
          let charcode = str.charCodeAt(i)
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
            charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
            utf8.push(
              0xf0 | (charcode >> 18),
              0x80 | ((charcode >> 12) & 0x3f),
              0x80 | ((charcode >> 6) & 0x3f),
              0x80 | (charcode & 0x3f),
            )
          }
        }
        return utf8
      }

      function createZip(files) {
        let out = []
        let centralDir = []
        let offset = 0

        function write32(val) {
          return [val & 0xff, (val >>> 8) & 0xff, (val >>> 16) & 0xff, (val >>> 24) & 0xff]
        }
        function write16(val) {
          return [val & 0xff, (val >>> 8) & 0xff]
        }

        let crcTable = []
        for (let n = 0; n < 256; n++) {
          let c = n
          for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
          }
          crcTable[n] = c >>> 0
        }

        function crc32(data) {
          let crc = 0 ^ -1
          for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
          }
          return (crc ^ -1) >>> 0
        }

        for (let i = 0; i < files.length; i++) {
          let file = files[i]
          let nameBytes = strToBytes(file.name)
          let dataBytes = typeof file.data === 'string' ? strToBytes(file.data) : file.data
          let crc = crc32(dataBytes)
          let size = dataBytes.length

          let localHeader = [
            0x50,
            0x4b,
            0x03,
            0x04,
            0x0a,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            ...write32(crc),
            ...write32(size),
            ...write32(size),
            ...write16(nameBytes.length),
            0x00,
            0x00,
          ]

          let centralHeader = [
            0x50,
            0x4b,
            0x01,
            0x02,
            0x14,
            0x00,
            0x0a,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            ...write32(crc),
            ...write32(size),
            ...write32(size),
            ...write16(nameBytes.length),
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            ...write32(offset),
          ]

          out.push(...localHeader, ...nameBytes, ...dataBytes)
          centralDir.push(...centralHeader, ...nameBytes)
          offset += localHeader.length + nameBytes.length + dataBytes.length
        }

        let centralDirSize = centralDir.length

        let eocd = [
          0x50,
          0x4b,
          0x05,
          0x06,
          0x00,
          0x00,
          0x00,
          0x00,
          ...write16(files.length),
          ...write16(files.length),
          ...write32(centralDirSize),
          ...write32(offset),
          0x00,
          0x00,
        ]

        out.push(...centralDir, ...eocd)
        return out
      }

      function bytesToBase64(bytes) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        let out = '',
          i = 0,
          len = bytes.length
        while (i < len) {
          let c1 = bytes[i++] & 0xff
          if (i == len) {
            out += chars.charAt(c1 >> 2) + chars.charAt((c1 & 0x3) << 4) + '=='
            break
          }
          let c2 = bytes[i++] & 0xff
          if (i == len) {
            out +=
              chars.charAt(c1 >> 2) +
              chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)) +
              chars.charAt((c2 & 0xf) << 2) +
              '='
            break
          }
          let c3 = bytes[i++] & 0xff
          out +=
            chars.charAt(c1 >> 2) +
            chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)) +
            chars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6)) +
            chars.charAt(c3 & 0x3f)
        }
        return out
      }

      const zipBytes = createZip(files)
      const base64 = bytesToBase64(zipBytes)

      return e.json(200, { base64 })
    } catch (err) {
      return e.badRequestError('Exportação falhou: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

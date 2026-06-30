routerAdd(
  'POST',
  '/backend/v1/spreadsheet/export',
  (e) => {
    const body = e.requestInfo().body

    let dataArray = body.data

    if (body.source === 'leads' && Array.isArray(body.ids)) {
      try {
        const ids = body.ids
        const headers = [
          'Nome',
          'Contato',
          'Telefone',
          'E-mail',
          'Tipo',
          'Origem',
          'Segmento',
          'Prioridade',
          'Status',
          'Vendedor',
          'Data de Cadastro',
          'Observações',
          'Tags',
        ]

        dataArray = [headers]

        for (const id of ids) {
          try {
            const lead = $app.findRecordById('leads', id)
            let vendedorNome = ''
            try {
              if (lead.getString('vendedor_id')) {
                const vendedor = $app.findRecordById('users', lead.getString('vendedor_id'))
                vendedorNome = vendedor.getString('name')
              }
            } catch (err) {}

            let tagsStr = ''
            try {
              const tags = lead.get('tags')
              if (Array.isArray(tags)) {
                tagsStr = tags.join(', ')
              } else if (tags && typeof tags === 'string') {
                tagsStr = tags
              }
            } catch (err) {}

            dataArray.push([
              lead.getString('nome'),
              lead.getString('contato_nome'),
              lead.getString('telefone'),
              lead.getString('email'),
              lead.getString('tipo'),
              lead.getString('origem'),
              lead.getString('segmento'),
              lead.getString('prioridade'),
              lead.getString('status'),
              vendedorNome,
              lead.getString('created') ? lead.getString('created').substring(0, 10) : '',
              lead.getString('observacoes'),
              tagsStr,
            ])
          } catch (err) {
            // Ignore missing lead
          }
        }
      } catch (err) {
        return e.badRequestError('Erro ao buscar leads: ' + err.message)
      }
    }

    if (body.source === 'clientes' && Array.isArray(body.ids)) {
      try {
        const ids = body.ids
        const headers = [
          'Tipo',
          'Documento',
          'Nome',
          'Nome Fantasia',
          'Segmento',
          'Porte',
          'Status',
          'Data de Cadastro',
          'Nome do Contato',
          'E-mail do Contato',
          'Telefone do Contato',
          'Cargo do Contato',
          'Aniversário do Contato',
          'Tipo de Contato',
        ]

        dataArray = [headers]

        for (const id of ids) {
          try {
            const cliente = $app.findRecordById('clientes', id)
            const baseRow = [
              cliente.getString('tipo'),
              cliente.getString('documento'),
              cliente.getString('nome'),
              cliente.getString('nome_fantasia'),
              cliente.getString('segmento'),
              cliente.getString('porte'),
              cliente.getString('status'),
              (function () {
                var raw = cliente.getString('data_cadastro')
                if (!raw) return ''
                var parts = raw.substring(0, 10).split('-')
                if (parts.length !== 3) return raw.substring(0, 10)
                var year = parts[0]
                var month = parts[1]
                var day = parts[2]
                if (year === '1900') {
                  return day + '/' + month
                }
                return day + '/' + month + '/' + year
              })(),
            ]

            const contatos = $app.findRecordsByFilter(
              'contatos',
              `cliente_id = '${id}'`,
              '-is_principal,created',
              100,
              0,
            )

            if (contatos.length === 0) {
              dataArray.push([...baseRow, '', '', '', '', '', ''])
            } else {
              for (const contato of contatos) {
                dataArray.push([
                  ...baseRow,
                  contato.getString('nome'),
                  contato.getString('email'),
                  contato.getString('telefone'),
                  contato.getString('cargo'),
                  (function () {
                    var raw = contato.getString('data_aniversario')
                    if (!raw) return ''
                    var parts = raw.substring(0, 10).split('-')
                    if (parts.length !== 3) return raw.substring(0, 10)
                    var year = parts[0]
                    var month = parts[1]
                    var day = parts[2]
                    if (year === '1900') {
                      return day + '/' + month
                    }
                    return day + '/' + month + '/' + year
                  })(),
                  contato.getBool('is_principal') ? 'Principal' : 'Adicional',
                ])
              }
            }
          } catch (err) {
            // Ignore missing client
          }
        }
      } catch (err) {
        return e.badRequestError('Erro ao buscar clientes: ' + err.message)
      }
    }

    if (body.source === 'negocios' && Array.isArray(body.ids)) {
      try {
        const ids = body.ids
        const headers = [
          'Cliente',
          'Fase do Funil',
          'Valor Estimado',
          'Probabilidade (%)',
          'Data Prevista Fechamento',
          'Data Fechamento Real',
          'Vendedor',
          'Descrição',
        ]

        dataArray = [headers]

        for (const id of ids) {
          try {
            const negocio = $app.findRecordById('negocios', id)
            let clienteNome = ''
            try {
              if (negocio.getString('cliente_id')) {
                const cliente = $app.findRecordById('clientes', negocio.getString('cliente_id'))
                clienteNome = cliente.getString('nome')
              }
            } catch (err) {}

            let vendedorNome = ''
            try {
              if (negocio.getString('vendedor_id')) {
                const vendedor = $app.findRecordById('users', negocio.getString('vendedor_id'))
                vendedorNome = vendedor.getString('name')
              }
            } catch (err) {}

            dataArray.push([
              clienteNome,
              negocio.getString('status'),
              negocio.get('valor_estimado') || 0,
              negocio.get('probabilidade') || 0,
              negocio.getString('data_prevista_fechamento')
                ? negocio.getString('data_prevista_fechamento').substring(0, 10)
                : '',
              negocio.getString('data_fechamento_real')
                ? negocio.getString('data_fechamento_real').substring(0, 10)
                : '',
              vendedorNome,
              negocio.getString('descricao'),
            ])
          } catch (err) {
            // Ignore missing
          }
        }
      } catch (err) {
        return e.badRequestError('Erro ao buscar negocios: ' + err.message)
      }
    }

    if (body.source === 'contatos' && Array.isArray(body.ids)) {
      try {
        const ids = body.ids
        const headers = ['Nome', 'E-mail', 'Telefone', 'Cargo', 'Cliente', 'Contato Principal']

        dataArray = [headers]

        for (const id of ids) {
          try {
            const contato = $app.findRecordById('contatos', id)
            let clienteNome = ''
            try {
              if (contato.getString('cliente_id')) {
                const cliente = $app.findRecordById('clientes', contato.getString('cliente_id'))
                clienteNome = cliente.getString('nome')
              }
            } catch (err) {}

            dataArray.push([
              contato.getString('nome'),
              contato.getString('email'),
              contato.getString('telefone'),
              contato.getString('cargo'),
              clienteNome,
              contato.getBool('is_principal') ? 'Sim' : 'Não',
            ])
          } catch (err) {}
        }
      } catch (err) {
        return e.badRequestError('Erro ao buscar contatos: ' + err.message)
      }
    }

    if (!dataArray || !Array.isArray(dataArray)) {
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

      dataArray.forEach((row) => {
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

      // Log to auditoria
      try {
        var auditCol = $app.findCollectionByNameOrId('auditoria')
        var auditRecord = new Record(auditCol)
        auditRecord.set('usuario_id', e.auth.id)
        auditRecord.set('acao', 'Exportação de ' + (body.source || 'dados'))
        auditRecord.set('recurso', body.source || 'desconhecido')
        var recordCount = Array.isArray(dataArray) ? Math.max(0, dataArray.length - 1) : 0
        auditRecord.set(
          'detalhes',
          'Formato: ' + (body.format || 'xlsx') + ' | ' + recordCount + ' registro(s)',
        )
        $app.save(auditRecord)
      } catch (auditErr) {}

      if (body.format === 'csv') {
        const escapeCsvStr = (str) => {
          if (str === null || str === undefined || str === '') return '""'
          return '"' + String(str).replace(/"/g, '""') + '"'
        }
        const csvContent = dataArray.map((row) => row.map(escapeCsvStr).join(',')).join('\n')

        const utf8BOM = [0xef, 0xbb, 0xbf]
        const csvBytes = strToBytes(csvContent)

        const fullBytes = [...utf8BOM, ...csvBytes]
        const base64 = bytesToBase64(fullBytes)

        return e.json(200, { base64, type: 'csv' })
      }

      const zipBytes = createZip(files)
      const base64 = bytesToBase64(zipBytes)

      return e.json(200, { base64, type: 'xlsx' })
    } catch (err) {
      return e.badRequestError('Exportação falhou: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

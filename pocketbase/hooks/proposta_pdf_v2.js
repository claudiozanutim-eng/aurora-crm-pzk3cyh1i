routerAdd(
  'GET',
  '/backend/v1/proposta/pdf/{id}',
  (e) => {
    const userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Autenticação necessária.')
    }

    const id = e.request.pathValue('id')

    let proposta
    try {
      proposta = $app.findRecordById('propostas', id)
    } catch (err) {
      return e.notFoundError('Proposta não encontrada.')
    }

    let cliente = null
    const clienteId = proposta.getString('cliente_id')
    if (clienteId) {
      try {
        cliente = $app.findRecordById('clientes', clienteId)
      } catch (err) {}
    }

    let negocio = null
    const negocioId = proposta.getString('negocio_id')
    if (negocioId) {
      try {
        negocio = $app.findRecordById('negocios', negocioId)
      } catch (err) {}
    }

    function sanitize(str) {
      if (!str) return ''
      return String(str)
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u2026]/g, '...')
        .replace(/\r/g, '')
    }

    const rawClientName = cliente
      ? cliente.getString('nome_fantasia') || cliente.getString('nome')
      : 'Cliente não informado'
    const clientName = sanitize(rawClientName)

    let clienteDoc = ''
    if (cliente && cliente.getString('documento')) {
      const tipo = cliente.getString('tipo') === 'PJ' ? 'CNPJ: ' : 'CPF: '
      clienteDoc = sanitize(tipo + cliente.getString('documento'))
    }

    let negocioDesc = ''
    if (negocio && negocio.getString('descricao')) {
      negocioDesc = sanitize(negocio.getString('descricao'))
    }

    const createdStr = proposta.getString('created')
    const d = new Date(createdStr)
    const dateStr =
      ('0' + d.getDate()).slice(-2) +
      '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      '/' +
      d.getFullYear()

    const valorTotal = proposta.getFloat('valor_total')
    const formattedValor =
      'R$ ' +
      valorTotal
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    class SimplePDF {
      constructor() {
        this.objs = []
        this.objCount = 1
        this.pages = []
        this.catalogId = this.addObj('<< /Type /Catalog /Pages 2 0 R >>')
        this.pagesId = this.addObj('')
        this.fontId = this.addObj(
          '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        )
        this.fontBoldId = this.addObj(
          '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        )
        this.newPage()
      }

      addObj(content) {
        let id = this.objCount++
        this.objs.push({ id, content, offset: 0 })
        return id
      }

      newPage() {
        if (this.currentStream) this.endPage()
        this.currentStream = ''
        this.y = 780
        this.pageId = this.addObj('')
        this.streamId = this.addObj('')
        this.pages.push(this.pageId)
      }

      endPage() {
        this.objs[this.streamId - 1].content =
          `<< /Length ${this.currentStream.length} >>\nstream\n${this.currentStream}\nendstream`
        this.objs[this.pageId - 1].content =
          `<< /Type /Page /Parent ${this.pagesId} 0 R /MediaBox [0 0 595 842] /Contents ${this.streamId} 0 R /Resources << /Font << /F1 ${this.fontId} 0 R /F2 ${this.fontBoldId} 0 R >> >> >>`
      }

      escape(str) {
        return String(str)
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/\n/g, ' ')
      }

      addText(text, x, y, size, font = 'F1', color = '0 0 0') {
        let safeText = this.escape(text)
        this.currentStream += `BT ${color} rg /${font} ${size} Tf ${x} ${y} Td (${safeText}) Tj ET\n`
      }

      addWrappedText(text, x, width, size, font = 'F1', color = '0 0 0') {
        let maxChars = Math.floor(width / (size * 0.5))
        let words = String(text).split(' ')
        let line = ''
        for (let word of words) {
          if ((line + (line ? ' ' : '') + word).length > maxChars) {
            if (line) {
              this.addText(line, x, this.y, size, font, color)
              this.y -= size + 6
              if (this.y < 50) this.newPage()
            }
            line = word
          } else {
            line = line ? line + ' ' + word : word
          }
        }
        if (line) {
          this.addText(line, x, this.y, size, font, color)
          this.y -= size + 6
          if (this.y < 50) this.newPage()
        }
      }

      addLine(x1, y1, x2, y2, color = '0 0 0') {
        this.currentStream += `${color} RG 1 w ${x1} ${y1} m ${x2} ${y2} l S\n`
      }

      build() {
        if (this.currentStream) this.endPage()
        let kids = this.pages.map((p) => `${p} 0 R`).join(' ')
        this.objs[this.pagesId - 1].content =
          `<< /Type /Pages /Count ${this.pages.length} /Kids [${kids}] >>`

        let out = '%PDF-1.4\n'
        for (let obj of this.objs) {
          obj.offset = out.length
          out += `${obj.id} 0 obj\n${obj.content}\nendobj\n`
        }

        let xrefOffset = out.length
        out += 'xref\n0 ' + this.objCount + '\n0000000000 65535 f \n'
        for (let obj of this.objs) {
          out += obj.offset.toString().padStart(10, '0') + ' 00000 n \n'
        }

        out +=
          'trailer\n<< /Size ' +
          this.objCount +
          ' /Root 1 0 R >>\nstartxref\n' +
          xrefOffset +
          '\n%%EOF\n'

        let bytes = new Uint8Array(out.length)
        for (let i = 0; i < out.length; i++) {
          bytes[i] = out.charCodeAt(i) & 0xff
        }
        return bytes
      }
    }

    const pdf = new SimplePDF()
    const orange = '0.976 0.451 0.086'
    const lightOrange = '0.992 0.729 0.455'
    const gray = '0.4 0.4 0.4'
    const black = '0 0 0'

    pdf.addText('IC Educ', 50, pdf.y, 24, 'F2', orange)
    pdf.addText('contato@iceduc.com.br', 410, pdf.y, 10, 'F1', gray)
    pdf.y -= 15
    pdf.addText(`Data de emissão: ${dateStr}`, 410, pdf.y, 10, 'F1', black)
    pdf.y -= 15
    pdf.addText(`Ref: #${proposta.id.substring(0, 8).toUpperCase()}`, 410, pdf.y, 10, 'F1', black)

    pdf.y -= 30
    pdf.addLine(50, pdf.y, 545, pdf.y, orange)
    pdf.y -= 30

    pdf.addText('PREPARADO PARA', 50, pdf.y, 10, 'F2', orange)
    pdf.y -= 15
    pdf.addText(clientName, 50, pdf.y, 16, 'F2', black)
    pdf.y -= 20

    if (clienteDoc) {
      pdf.addText(clienteDoc, 50, pdf.y, 12, 'F1', gray)
      pdf.y -= 15
    }
    if (negocioDesc) {
      pdf.addText(`Negócio: ${negocioDesc}`, 50, pdf.y, 12, 'F1', gray)
      pdf.y -= 15
    }

    pdf.y -= 30
    pdf.addWrappedText(sanitize(proposta.getString('titulo')), 50, 495, 20, 'F2', orange)
    pdf.y -= 10

    function addSection(title, content) {
      pdf.y -= 15
      if (pdf.y < 80) pdf.newPage()
      pdf.addText(title, 50, pdf.y, 14, 'F2', orange)
      pdf.y -= 10
      pdf.addLine(50, pdf.y, 200, pdf.y, lightOrange)
      pdf.y -= 20

      const lines = sanitize(content).split('\n')
      for (let line of lines) {
        line = line.trim()
        if (line === '') {
          pdf.y -= 10
          continue
        }
        pdf.addWrappedText(line, 50, 495, 11, 'F1', black)
      }
      pdf.y -= 10
    }

    addSection('Escopo e Descrição dos Serviços', proposta.getString('descricao_servicos'))

    pdf.y -= 15
    if (pdf.y < 80) pdf.newPage()
    pdf.addText('Investimento', 50, pdf.y, 14, 'F2', orange)
    pdf.y -= 10
    pdf.addLine(50, pdf.y, 200, pdf.y, lightOrange)
    pdf.y -= 25
    pdf.addText(formattedValor, 50, pdf.y, 18, 'F2', black)
    pdf.y -= 25

    addSection('Condições Comerciais', proposta.getString('condicoes_comerciais'))

    pdf.y -= 40
    if (pdf.y < 80) pdf.newPage()
    pdf.addLine(50, pdf.y, 545, pdf.y, orange)
    pdf.y -= 20

    const validadeStr = proposta.getString('validade_ate')
    let valMsg = 'Proposta válida até a data combinada'
    if (validadeStr) {
      const parts = validadeStr.split(' ')[0].split('-')
      if (parts.length === 3) {
        valMsg = `Proposta válida até ${parts[2]}/${parts[1]}/${parts[0]}`
      } else {
        const vDate = new Date(validadeStr)
        const vDateFormatted =
          ('0' + vDate.getUTCDate()).slice(-2) +
          '/' +
          ('0' + (vDate.getUTCMonth() + 1)).slice(-2) +
          '/' +
          vDate.getUTCFullYear()
        valMsg = `Proposta válida até ${vDateFormatted}`
      }
    }
    pdf.addText(valMsg, 210, pdf.y, 10, 'F1', gray)
    pdf.y -= 15
    pdf.addText(
      'Agradecemos a oportunidade de apresentar esta proposta comercial.',
      130,
      pdf.y,
      10,
      'F1',
      black,
    )

    let pdfBytes
    try {
      pdfBytes = pdf.build()
    } catch (err) {
      return e.internalServerError('Falha ao gerar o documento PDF.')
    }

    const safeClientName = rawClientName.replace(/[^a-zA-Z0-9À-ÿ -]/g, '').trim()
    const fileName = `Proposta_${safeClientName}_${dateStr.replace(/\//g, '-')}.pdf`

    e.response.header().set('Access-Control-Expose-Headers', 'Content-Disposition')
    e.response
      .header()
      .set(
        'Content-Disposition',
        `attachment; filename="${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}"`,
      )

    return e.blob(200, 'application/pdf', pdfBytes.buffer)
  },
  $apis.requireAuth(),
)

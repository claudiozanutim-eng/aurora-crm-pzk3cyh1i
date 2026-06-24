routerAdd(
  'GET',
  '/backend/v1/propostas/{id}/pdf',
  async (e) => {
    if (!e.auth?.id) {
      return e.unauthorizedError('Autenticação necessária.')
    }

    const id = e.request.pathValue('id')

    let pdfLibRes
    try {
      // Fetch the pre-bundled UMD version of pdf-lib to bypass the bundler
      pdfLibRes = $http.send({
        url: 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
        method: 'GET',
      })
    } catch (err) {
      return e.internalServerError('Falha ao baixar dependência de PDF.')
    }

    if (pdfLibRes.statusCode !== 200) {
      return e.internalServerError('Falha ao carregar biblioteca de PDF.')
    }

    // Evaluate the UMD source code with an injected CommonJS module/exports scope
    const source = new TextDecoder().decode(pdfLibRes.body)
    const moduleObj = { exports: {} }

    const loadLib = new Function('module', 'exports', source)
    loadLib(moduleObj, moduleObj.exports)

    const { PDFDocument, rgb, StandardFonts } = moduleObj.exports

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
        .replace(/[^\x00-\xFF]/g, '')
    }

    const createdStr = proposta.getString('created')
    const d = new Date(createdStr)
    const dateStr =
      ('0' + d.getDate()).slice(-2) +
      '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      '/' +
      d.getFullYear()

    const rawClientName = cliente ? cliente.getString('nome') : 'Cliente não informado'
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

    const valorTotal = proposta.getFloat('valor_total')
    const formattedValor =
      'R$ ' +
      valorTotal
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595.28 // A4
    const pageHeight = 841.89 // A4
    const margin = 50
    let y = pageHeight - margin
    let page = pdfDoc.addPage([pageWidth, pageHeight])

    const orange = rgb(249 / 255, 115 / 255, 22 / 255)
    const lightOrange = rgb(253 / 255, 186 / 255, 116 / 255)
    const gray = rgb(102 / 255, 102 / 255, 102 / 255)
    const black = rgb(0, 0, 0)

    function checkPageAdd(spaceRequired) {
      if (y - spaceRequired < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
    }

    // Header
    page.drawText('IC Educ', { x: margin, y, size: 24, font: helveticaBold, color: orange })

    page.drawText('contato@iceduc.com.br', {
      x: pageWidth - margin - helveticaFont.widthOfTextAtSize('contato@iceduc.com.br', 10),
      y: y + 10,
      size: 10,
      font: helveticaFont,
      color: gray,
    })
    y -= 15
    page.drawText(`Data de emissão: ${dateStr}`, {
      x: pageWidth - margin - helveticaFont.widthOfTextAtSize(`Data de emissão: ${dateStr}`, 10),
      y: y + 10,
      size: 10,
      font: helveticaFont,
      color: gray,
    })
    y -= 15
    const refStr = `Ref: #${proposta.id.substring(0, 8).toUpperCase()}`
    page.drawText(refStr, {
      x: pageWidth - margin - helveticaFont.widthOfTextAtSize(refStr, 10),
      y: y + 10,
      size: 10,
      font: helveticaFont,
      color: gray,
    })

    y -= 20
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: orange,
    })
    y -= 30

    // Preparado para
    page.drawText('PREPARADO PARA', { x: margin, y, size: 10, font: helveticaBold, color: orange })
    y -= 20

    page.drawText(clientName, { x: margin, y, size: 16, font: helveticaBold, color: black })
    y -= 15

    if (clienteDoc) {
      page.drawText(clienteDoc, { x: margin, y, size: 12, font: helveticaFont, color: gray })
      y -= 15
    }
    if (negocioDesc) {
      page.drawText(`Negócio: ${negocioDesc}`, {
        x: margin,
        y,
        size: 12,
        font: helveticaFont,
        color: gray,
      })
      y -= 15
    }

    y -= 20
    const title = sanitize(proposta.getString('titulo'))

    // Wrap Title
    const titleWords = title.split(/\s+/)
    let currentLine = ''
    for (const word of titleWords) {
      const w = helveticaBold.widthOfTextAtSize(currentLine + ' ' + word, 20)
      if (w < pageWidth - 2 * margin) {
        currentLine += (currentLine === '' ? '' : ' ') + word
      } else {
        page.drawText(currentLine, { x: margin, y, size: 20, font: helveticaBold, color: orange })
        y -= 25
        currentLine = word
      }
    }
    if (currentLine) {
      page.drawText(currentLine, { x: margin, y, size: 20, font: helveticaBold, color: orange })
      y -= 30
    }

    function addSection(titleStr, content) {
      checkPageAdd(80)
      page.drawText(titleStr, { x: margin, y, size: 14, font: helveticaBold, color: orange })
      y -= 10
      page.drawLine({
        start: { x: margin, y },
        end: { x: margin + 150, y },
        thickness: 1,
        color: lightOrange,
      })
      y -= 20

      const paragraphs = sanitize(content || '').split('\n')
      for (const p of paragraphs) {
        if (!p.trim()) {
          y -= 15
          continue
        }
        const words = p.split(/\s+/)
        let line = ''
        for (const word of words) {
          const w = helveticaFont.widthOfTextAtSize(line + ' ' + word, 11)
          if (w < pageWidth - 2 * margin) {
            line += (line === '' ? '' : ' ') + word
          } else {
            checkPageAdd(20)
            page.drawText(line, { x: margin, y, size: 11, font: helveticaFont, color: black })
            y -= 15
            line = word
          }
        }
        if (line) {
          checkPageAdd(20)
          page.drawText(line, { x: margin, y, size: 11, font: helveticaFont, color: black })
          y -= 15
        }
      }
      y -= 10
    }

    addSection('Escopo e Descrição dos Serviços', proposta.getString('descricao_servicos'))

    // Investimento
    checkPageAdd(80)
    page.drawText('Investimento', { x: margin, y, size: 14, font: helveticaBold, color: orange })
    y -= 10
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 150, y },
      thickness: 1,
      color: lightOrange,
    })
    y -= 20
    page.drawText(formattedValor, { x: margin, y, size: 18, font: helveticaBold, color: black })
    y -= 30

    addSection('Condições Comerciais', proposta.getString('condicoes_comerciais'))

    checkPageAdd(60)
    y -= 10
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: orange,
    })
    y -= 20

    const valMsg = `Validade desta proposta: ${proposta.getInt('validade_dias')} dias a partir da data de envio.`
    const valW = helveticaFont.widthOfTextAtSize(valMsg, 10)
    page.drawText(valMsg, {
      x: (pageWidth - valW) / 2,
      y,
      size: 10,
      font: helveticaFont,
      color: gray,
    })

    y -= 15
    const thxMsg = 'Agradecemos a oportunidade de apresentar esta proposta comercial.'
    const thxW = helveticaFont.widthOfTextAtSize(thxMsg, 10)
    page.drawText(thxMsg, {
      x: (pageWidth - thxW) / 2,
      y,
      size: 10,
      font: helveticaFont,
      color: gray,
    })

    const pdfBytes = await pdfDoc.save()
    const exactBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength,
    )

    // Dynamic Filename Header
    const now = new Date()
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const monthName = months[now.getMonth()]
    const year = now.getFullYear()

    const safeClientName = rawClientName.replace(/[^a-zA-Z0-9À-ÿ -]/g, '').trim()
    const fileName = `Proposta ${safeClientName} ${monthName} ${year}.pdf`

    e.response.header().set('Access-Control-Expose-Headers', 'Content-Disposition')
    e.response
      .header()
      .set(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}; filename="${safeClientName.replace(/[^a-zA-Z0-9 -]/g, '')}.pdf"`,
      )

    return e.blob(200, 'application/pdf', exactBuffer)
  },
  $apis.requireAuth(),
)

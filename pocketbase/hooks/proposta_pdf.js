// @deps pdf-lib@1.17.1
routerAdd(
  'GET',
  '/backend/v1/propostas/{id}/pdf',
  async (e) => {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')

    if (!e.auth?.id) {
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

    const pdfDoc = await PDFDocument.create()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let page = pdfDoc.addPage([595.28, 841.89]) // A4
    const margin = 50
    const maxWidth = page.getWidth() - margin * 2
    let cursorY = page.getHeight() - margin

    const orange = rgb(0.976, 0.451, 0.086)
    const gray = rgb(0.4, 0.4, 0.4)
    const black = rgb(0, 0, 0)

    const drawText = (text, font, size, color, x, y) => {
      page.drawText(text, { x, y, size, font, color })
    }

    function breakText(text, font, size, maxW) {
      const lines = []
      const paragraphs = (text || '').split('\n')
      for (const p of paragraphs) {
        if (!p.trim()) {
          lines.push('')
          continue
        }
        const words = p.split(/\s+/)
        let currentLine = words[0] || ''
        for (let i = 1; i < words.length; i++) {
          const word = words[i]
          const width = font.widthOfTextAtSize(currentLine + ' ' + word, size)
          if (width < maxW) {
            currentLine += ' ' + word
          } else {
            lines.push(currentLine)
            currentLine = word
          }
        }
        lines.push(currentLine)
      }
      return lines
    }

    const checkPageBreak = (neededHeight) => {
      if (cursorY - neededHeight < margin) {
        page = pdfDoc.addPage([595.28, 841.89])
        cursorY = page.getHeight() - margin
      }
    }

    drawText('IC Educ', fontBold, 24, orange, margin, cursorY)

    const createdStr = proposta.getString('created')
    const d = new Date(createdStr)
    const dateStr =
      ('0' + d.getDate()).slice(-2) +
      '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      '/' +
      d.getFullYear()

    const rightTexts = [
      'contato@iceduc.com.br',
      'Data de emissão: ' + dateStr,
      'Ref: #' + proposta.id.substring(0, 8).toUpperCase(),
    ]
    let ry = cursorY
    for (const rt of rightTexts) {
      const w = fontNormal.widthOfTextAtSize(rt, 10)
      drawText(rt, fontNormal, 10, gray, page.getWidth() - margin - w, ry)
      ry -= 14
    }

    cursorY -= 40
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: page.getWidth() - margin, y: cursorY },
      thickness: 1,
      color: orange,
    })
    cursorY -= 30

    drawText('PREPARADO PARA', fontBold, 10, orange, margin, cursorY)
    cursorY -= 20
    const clientName = cliente ? cliente.getString('nome') : 'Cliente não informado'
    drawText(clientName, fontBold, 16, black, margin, cursorY)
    cursorY -= 16
    if (cliente && cliente.getString('documento')) {
      const tipo = cliente.getString('tipo') === 'PJ' ? 'CNPJ: ' : 'CPF: '
      drawText(tipo + cliente.getString('documento'), fontNormal, 10, gray, margin, cursorY)
      cursorY -= 14
    }
    if (negocio && negocio.getString('descricao')) {
      drawText('Negócio: ' + negocio.getString('descricao'), fontNormal, 10, gray, margin, cursorY)
      cursorY -= 14
    }

    cursorY -= 40

    const tituloLines = breakText(proposta.getString('titulo'), fontBold, 20, maxWidth)
    for (const line of tituloLines) {
      checkPageBreak(30)
      drawText(line, fontBold, 20, orange, margin, cursorY)
      cursorY -= 24
    }
    cursorY -= 16

    const writeSection = (title, content) => {
      checkPageBreak(50)
      drawText(title, fontBold, 14, orange, margin, cursorY)
      cursorY -= 10
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: margin + 200, y: cursorY },
        thickness: 1,
        color: rgb(0.99, 0.8, 0.6),
      })
      cursorY -= 20

      const lines = breakText(content, fontNormal, 11, maxWidth)
      for (const line of lines) {
        checkPageBreak(15)
        if (line.trim()) {
          drawText(line, fontNormal, 11, black, margin, cursorY)
        }
        cursorY -= 15
      }
      cursorY -= 20
    }

    writeSection('Escopo e Descrição dos Serviços', proposta.getString('descricao_servicos'))

    const valorTotal = proposta.getFloat('valor_total')
    const formattedValor =
      'R$ ' +
      valorTotal
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    checkPageBreak(50)
    drawText('Investimento', fontBold, 14, orange, margin, cursorY)
    cursorY -= 10
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: margin + 200, y: cursorY },
      thickness: 1,
      color: rgb(0.99, 0.8, 0.6),
    })
    cursorY -= 20
    drawText(formattedValor, fontBold, 16, black, margin, cursorY)
    cursorY -= 40

    writeSection('Condições Comerciais', proposta.getString('condicoes_comerciais'))

    checkPageBreak(100)
    cursorY -= 20
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: page.getWidth() - margin, y: cursorY },
      thickness: 1,
      color: orange,
    })
    cursorY -= 30

    const validadeStr =
      'Validade desta proposta: ' +
      proposta.getInt('validade_dias') +
      ' dias a partir da data de envio.'
    const w1 = fontNormal.widthOfTextAtSize(validadeStr, 10)
    drawText(validadeStr, fontNormal, 10, gray, (page.getWidth() - w1) / 2, cursorY)
    cursorY -= 15

    const thanksStr = 'Agradecemos a oportunidade de apresentar esta proposta comercial.'
    const w2 = fontNormal.widthOfTextAtSize(thanksStr, 10)
    drawText(thanksStr, fontNormal, 10, gray, (page.getWidth() - w2) / 2, cursorY)

    const pdfBytes = await pdfDoc.save()

    e.response
      .header()
      .set('Content-Disposition', 'attachment; filename="Proposta_' + proposta.id + '.pdf"')
    return e.blob(200, 'application/pdf', pdfBytes)
  },
  $apis.requireAuth(),
)

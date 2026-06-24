// @deps pdf-lib@1.17.5
routerAdd(
  'GET',
  '/backend/v1/propostas/{id}/pdf',
  async (e) => {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')

    const id = e.request.pathValue('id')
    const p = $app.findRecordById('propostas', id)
    $app.expandRecord(p, ['cliente_id', 'negocio_id'])

    let cliente = null
    let negocio = null
    try {
      cliente = p.expandedOne('cliente_id')
    } catch (_) {}
    try {
      negocio = p.expandedOne('negocio_id')
    } catch (_) {}

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    let y = 800
    const margin = 50

    function drawText(text, size, f, color) {
      page.drawText(text, { x: margin, y, size, font: f, color })
    }

    function checkPage(needed) {
      if (y - needed < 50) {
        page = pdfDoc.addPage([595.28, 841.89])
        y = 800
      }
    }

    function cleanText(t) {
      return (t || '').replace(/[^\x00-\xFF]/g, (char) => {
        if (char === '•') return '-'
        if (char === '“' || char === '”') return '"'
        if (char === '‘' || char === '’') return "'"
        if (char === '–' || char === '—') return '-'
        return ''
      })
    }

    function splitText(text, f, size, maxWidth) {
      const lines = []
      const paragraphs = text.split('\n')
      for (const para of paragraphs) {
        if (!para) {
          lines.push('')
          continue
        }
        const words = para.split(' ')
        let currentLine = words[0] || ''
        for (let i = 1; i < words.length; i++) {
          const word = words[i]
          const width = f.widthOfTextAtSize(currentLine + ' ' + word, size)
          if (width < maxWidth) {
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

    const orange = rgb(249 / 255, 115 / 255, 22 / 255)
    const black = rgb(0, 0, 0)
    const gray = rgb(75 / 255, 85 / 255, 99 / 255)

    drawText('IC Educ', 24, boldFont, orange)
    y -= 40

    drawText('PREPARADO PARA:', 10, boldFont, black)
    y -= 15

    drawText(
      cleanText(cliente ? cliente.getString('nome') : 'Cliente não informado'),
      14,
      font,
      black,
    )
    y -= 15

    if (cliente && cliente.getString('documento')) {
      const docType = cliente.getString('tipo') === 'PJ' ? 'CNPJ: ' : 'CPF: '
      drawText(docType + cliente.getString('documento'), 10, font, gray)
      y -= 15
    }
    if (negocio && negocio.getString('descricao')) {
      drawText(cleanText('Negócio: ' + negocio.getString('descricao')), 10, font, gray)
      y -= 15
    }
    y -= 25

    checkPage(40)
    drawText(cleanText(p.getString('titulo')), 18, boldFont, orange)
    y -= 30

    checkPage(30)
    drawText('Escopo e Descrição dos Serviços', 14, boldFont, black)
    y -= 20

    const descLines = splitText(cleanText(p.getString('descricao_servicos')), font, 11, 495)
    for (const line of descLines) {
      checkPage(15)
      drawText(line, 11, font, gray)
      y -= 15
    }
    y -= 10

    checkPage(40)
    drawText('Investimento', 14, boldFont, black)
    y -= 20

    const valNum = p.getFloat('valor_total') || 0
    const valorFormatado =
      'R$ ' +
      valNum
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    drawText(valorFormatado, 14, font, black)
    y -= 30

    checkPage(40)
    drawText('Condições Comerciais', 14, boldFont, black)
    y -= 20

    const condLines = splitText(cleanText(p.getString('condicoes_comerciais')), font, 11, 495)
    for (const line of condLines) {
      checkPage(15)
      drawText(line, 11, font, gray)
      y -= 15
    }
    y -= 30

    checkPage(40)
    const valText = cleanText(
      `Validade desta proposta: ${p.getInt('validade_dias')} dias a partir da data de envio.`,
    )
    const w1 = font.widthOfTextAtSize(valText, 10)
    page.drawText(valText, { x: (595.28 - w1) / 2, y, size: 10, font, color: gray })
    y -= 15

    const valText2 = cleanText('Agradecemos a oportunidade de apresentar esta proposta comercial.')
    const w2 = font.widthOfTextAtSize(valText2, 10)
    page.drawText(valText2, { x: (595.28 - w2) / 2, y, size: 10, font, color: gray })

    const pdfBytes = await pdfDoc.save()

    e.response.header().set('Content-Disposition', `attachment; filename="proposta-${id}.pdf"`)
    return e.blob(200, 'application/pdf', pdfBytes.buffer)
  },
  $apis.requireAuth(),
)

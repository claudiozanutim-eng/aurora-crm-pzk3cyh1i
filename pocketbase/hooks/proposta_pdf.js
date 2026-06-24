// @deps jspdf@2.5.2
routerAdd(
  'GET',
  '/backend/v1/propostas/{id}/pdf',
  (e) => {
    const { jsPDF } = require('jspdf')

    const id = e.request.pathValue('id')
    const record = $app.findRecordById('propostas', id)

    if (!$app.canAccessRecord(record, e.requestInfo(), record.collection().viewRule)) {
      return e.forbiddenError('Acesso negado')
    }

    let cliente = null
    let negocio = null
    try {
      const clienteId = record.getString('cliente_id')
      if (clienteId) cliente = $app.findRecordById('clientes', clienteId)
    } catch (err) {}

    try {
      const negocioId = record.getString('negocio_id')
      if (negocioId) negocio = $app.findRecordById('negocios', negocioId)
    } catch (err) {}

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(249, 115, 22) // Orange-500
    doc.text('IC Educ', margin, y)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const createdDate = new Date(record.getDateTime('created').time())
    doc.text('contato@iceduc.com.br', pageWidth - margin, y - 8, { align: 'right' })
    doc.text(
      `Data de emissão: ${createdDate.toLocaleDateString('pt-BR')}`,
      pageWidth - margin,
      y - 3,
      { align: 'right' },
    )
    doc.text(`Ref: #${record.getId().substring(0, 8).toUpperCase()}`, pageWidth - margin, y + 2, {
      align: 'right',
    })

    y += 10
    doc.setDrawColor(249, 115, 22)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 15

    // Preparado para
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    doc.text('PREPARADO PARA', margin, y)
    y += 6

    doc.setFontSize(16)
    doc.setTextColor(30, 30, 30)
    doc.text(cliente ? cliente.getString('nome') : 'Cliente não informado', margin, y)
    y += 6

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    if (cliente && cliente.getString('documento')) {
      const tipo = cliente.getString('tipo') === 'PJ' ? 'CNPJ: ' : 'CPF: '
      doc.text(`${tipo}${cliente.getString('documento')}`, margin, y)
      y += 5
    }
    if (negocio && negocio.getString('descricao')) {
      doc.text(`Negócio: ${negocio.getString('descricao')}`, margin, y)
      y += 5
    }

    y += 10

    // Titulo
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    const tituloLines = doc.splitTextToSize(record.getString('titulo'), contentWidth)
    checkPageBreak(tituloLines.length * 10)
    doc.text(tituloLines, margin, y)
    y += tituloLines.length * 8 + 5

    // Escopo
    checkPageBreak(20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    doc.text('Escopo e Descrição dos Serviços', margin, y)
    y += 3
    doc.setDrawColor(255, 237, 213)
    doc.line(margin, y, margin + 80, y)
    y += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)

    const processText = (text) => {
      const lines = []
      text.split('\n').forEach((paragraph) => {
        if (paragraph.trim() === '') {
          lines.push('')
        } else {
          lines.push(...doc.splitTextToSize(paragraph, contentWidth))
        }
      })
      return lines
    }

    const descLines = processText(record.getString('descricao_servicos'))
    for (const line of descLines) {
      checkPageBreak(6)
      doc.text(line, margin, y)
      y += 6
    }
    y += 10

    // Investimento
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    doc.text('Investimento', margin, y)
    y += 3
    doc.line(margin, y, margin + 35, y)
    y += 10

    doc.setFontSize(18)
    doc.setTextColor(30, 30, 30)
    const valorTotal = record.getFloat('valor_total')
    let valorFormatado = 'R$ ' + valorTotal.toFixed(2).replace('.', ',')
    try {
      valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valorTotal)
    } catch (err) {}
    doc.text(valorFormatado, margin, y)
    y += 15

    // Condições Comerciais
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    doc.text('Condições Comerciais', margin, y)
    y += 3
    doc.line(margin, y, margin + 55, y)
    y += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)

    const condLines = processText(record.getString('condicoes_comerciais'))
    for (const line of condLines) {
      checkPageBreak(6)
      doc.text(line, margin, y)
      y += 6
    }

    y += 20

    // Footer
    checkPageBreak(30)
    doc.setDrawColor(249, 115, 22)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Validade desta proposta: ${record.getInt('validade_dias')} dias a partir da data de envio.`,
      pageWidth / 2,
      y,
      { align: 'center' },
    )
    y += 5
    doc.text(
      'Agradecemos a oportunidade de apresentar esta proposta comercial.',
      pageWidth / 2,
      y,
      { align: 'center' },
    )

    const pdfBytes = doc.output('arraybuffer')

    const fileName = `Proposta-${record.getString('titulo').replace(/[^a-z0-9]/gi, '_')}.pdf`
    e.response.header().set('Content-Disposition', `attachment; filename="${fileName}"`)
    return e.blob(200, 'application/pdf', new Uint8Array(pdfBytes))
  },
  $apis.requireAuth(),
)

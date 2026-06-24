// @deps pdfkit@0.15.0
routerAdd(
  'GET',
  '/backend/v1/proposta/pdf/{id}',
  async (e) => {
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

    const PDFDocument = require('pdfkit')

    let pdfBytes
    try {
      pdfBytes = await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50, size: 'A4' })
          const chunks = []
          doc.on('data', (chunk) => chunks.push(chunk))
          doc.on('end', () => {
            const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
            const bytes = new Uint8Array(totalLength)
            let offset = 0
            for (const chunk of chunks) {
              bytes.set(chunk, offset)
              offset += chunk.length
            }
            resolve(bytes)
          })
          doc.on('error', reject)

          const orange = '#f97316'
          const lightOrange = '#fdba74'
          const gray = '#666666'
          const black = '#000000'

          doc
            .font('Helvetica-Bold')
            .fillColor(orange)
            .fontSize(24)
            .text('IC Educ', { align: 'left' })
          doc.moveUp()
          doc
            .font('Helvetica')
            .fillColor(gray)
            .fontSize(10)
            .text('contato@iceduc.com.br', { align: 'right' })
          doc.text(`Data de emissão: ${dateStr}`, { align: 'right' })
          doc.text(`Ref: #${proposta.id.substring(0, 8).toUpperCase()}`, { align: 'right' })

          doc.moveDown()
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(orange).stroke()
          doc.moveDown()

          doc
            .font('Helvetica-Bold')
            .fillColor(orange)
            .fontSize(10)
            .text('PREPARADO PARA', { continued: false })
          doc.moveDown(0.5)
          doc.font('Helvetica-Bold').fillColor(black).fontSize(16).text(clientName)

          if (clienteDoc) {
            doc.font('Helvetica').fillColor(gray).fontSize(12).text(clienteDoc)
          }
          if (negocioDesc) {
            doc.font('Helvetica').fillColor(gray).fontSize(12).text(`Negócio: ${negocioDesc}`)
          }

          doc.moveDown(2)
          doc
            .font('Helvetica-Bold')
            .fillColor(orange)
            .fontSize(20)
            .text(sanitize(proposta.getString('titulo')))
          doc.moveDown()

          function addSection(title, content) {
            doc.font('Helvetica-Bold').fillColor(orange).fontSize(14).text(title)
            doc.moveDown(0.5)
            doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor(lightOrange).stroke()
            doc.moveDown()
            doc
              .font('Helvetica')
              .fillColor(black)
              .fontSize(11)
              .text(sanitize(content), { align: 'justify' })
            doc.moveDown()
          }

          addSection('Escopo e Descrição dos Serviços', proposta.getString('descricao_servicos'))

          doc.moveDown()
          doc.font('Helvetica-Bold').fillColor(orange).fontSize(14).text('Investimento')
          doc.moveDown(0.5)
          doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor(lightOrange).stroke()
          doc.moveDown()
          doc.font('Helvetica-Bold').fillColor(black).fontSize(18).text(formattedValor)
          doc.moveDown()

          addSection('Condições Comerciais', proposta.getString('condicoes_comerciais'))

          doc.moveDown(2)
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(orange).stroke()
          doc.moveDown()

          const valMsg = `Validade desta proposta: ${proposta.getInt('validade_dias')} dias a partir da data de envio.`
          doc.font('Helvetica').fillColor(gray).fontSize(10).text(valMsg, { align: 'center' })
          doc.text('Agradecemos a oportunidade de apresentar esta proposta comercial.', {
            align: 'center',
          })

          doc.end()
        } catch (err) {
          reject(err)
        }
      })
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

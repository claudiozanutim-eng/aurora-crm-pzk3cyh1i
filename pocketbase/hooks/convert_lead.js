routerAdd(
  'POST',
  '/backend/v1/convert-lead',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.lead_id) {
      throw new BadRequestError('Missing lead_id')
    }

    function normalize(str) {
      if (!str) return ''
      const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'
      const accentsOut = 'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz'
      let s = str
        .split('')
        .map((letter) => {
          let accentIndex = accents.indexOf(letter)
          return accentIndex !== -1 ? accentsOut[accentIndex] : letter
        })
        .join('')
      // Convert punctuation that separates words into spaces first
      s = s.replace(/[-_./\\]/g, ' ')
      // Remove any other non-word/non-space character
      s = s.replace(/[^\w\s]/gi, '')
      // Collapse multiple spaces
      s = s.replace(/\s+/g, ' ')
      return s.trim().toLowerCase()
    }

    let result
    let customError = null
    let conflictResponse = null
    const ignoreDuplicates = body.ignore_duplicates === true

    try {
      $app.runInTransaction((txApp) => {
        let lead
        try {
          lead = txApp.findRecordById('leads', body.lead_id)
        } catch (_) {
          customError = new NotFoundError('Lead not found')
          throw new Error('Lead not found')
        }

        const novoNomeCliente = (body.cliente_nome || lead.getString('nome')).trim()
        const normalizedNewName = normalize(novoNomeCliente)
        let leadEmail = lead.getString('email')
        let leadPhone = lead.getString('telefone')
        const normalizedPhone = leadPhone ? leadPhone.replace(/\D/g, '') : ''

        let duplicates = []

        const rsClientes = txApp.findRecordsByFilter('clientes', '1=1', '', 10000, 0) || []
        for (const r of rsClientes) {
          const cName = r.getString('nome')
          if (normalize(cName) === normalizedNewName) {
            duplicates.push(`Nome similar encontrado em Clientes: ${cName}`)
            break
          }
        }

        if (leadEmail) {
          const rsContatos =
            txApp.findRecordsByFilter('contatos', "email != ''", '', 10000, 0) || []
          for (const r of rsContatos) {
            const cEmail = r.getString('email')
            if (cEmail && cEmail.toLowerCase().trim() === leadEmail.toLowerCase().trim()) {
              try {
                const cliente = txApp.findRecordById('clientes', r.getString('cliente_id'))
                duplicates.push(
                  `E-mail já existente em Clientes: ${leadEmail} (Cliente: ${cliente.getString('nome')})`,
                )
                break
              } catch (_) {}
            }
          }
        }

        if (normalizedPhone) {
          const rsContatos =
            txApp.findRecordsByFilter('contatos', "telefone != ''", '', 10000, 0) || []
          for (const r of rsContatos) {
            const cPhone = r.getString('telefone')
            if (cPhone && cPhone.replace(/\D/g, '') === normalizedPhone) {
              try {
                const cliente = txApp.findRecordById('clientes', r.getString('cliente_id'))
                duplicates.push(
                  `Telefone já existente em Clientes: ${leadPhone} (Cliente: ${cliente.getString('nome')})`,
                )
                break
              } catch (_) {}
            }
          }
        }

        const rsLeads =
          txApp.findRecordsByFilter('leads', "id != '" + lead.id + "'", '', 10000, 0) || []
        for (const r of rsLeads) {
          const lName = r.getString('nome')
          if (normalize(lName) === normalizedNewName) {
            duplicates.push(`Nome similar encontrado em outro Lead: ${lName}`)
            break
          }
        }

        if (leadEmail) {
          for (const r of rsLeads) {
            const lEmail = r.getString('email')
            if (lEmail && lEmail.toLowerCase().trim() === leadEmail.toLowerCase().trim()) {
              duplicates.push(`E-mail já existente em outro Lead: ${lEmail}`)
              break
            }
          }
        }

        if (normalizedPhone) {
          for (const r of rsLeads) {
            const lPhone = r.getString('telefone')
            if (lPhone && lPhone.replace(/\D/g, '') === normalizedPhone) {
              duplicates.push(`Telefone já existente em outro Lead: ${lPhone}`)
              break
            }
          }
        }

        if (duplicates.length > 0 && !ignoreDuplicates) {
          conflictResponse = { error: 'duplicate_warning', duplicates }
          throw new Error('DUPLICATE_WARNING')
        }

        const clientesCol = txApp.findCollectionByNameOrId('clientes')
        const cliente = new Record(clientesCol)
        cliente.set('nome', novoNomeCliente)
        cliente.set('tipo', lead.getString('tipo'))
        cliente.set('segmento', lead.getString('segmento'))
        cliente.set('status', 'Ativo')

        const now = new Date()
        const pbDate = now.toISOString().split('.')[0].replace('T', ' ') + 'Z'
        cliente.set('data_cadastro', pbDate)
        cliente.set('data_conversao', pbDate)
        cliente.set('porte', 'Pequeno')

        if (lead.get('tags')) {
          cliente.set('tags', lead.get('tags'))
        }

        txApp.save(cliente)

        const contatosCol = txApp.findCollectionByNameOrId('contatos')
        const contato = new Record(contatosCol)
        contato.set('cliente_id', cliente.id)
        contato.set('nome', lead.getString('contato_nome') || lead.getString('nome'))
        if (leadEmail) contato.set('email', leadEmail)
        if (leadPhone) contato.set('telefone', leadPhone)
        contato.set('is_principal', true)

        txApp.save(contato)

        const negociosCol = txApp.findCollectionByNameOrId('negocios')
        const negocio = new Record(negociosCol)
        negocio.set('cliente_id', cliente.id)
        negocio.set('vendedor_id', lead.getString('vendedor_id'))
        negocio.set('status', 'Prospect')
        negocio.set('prioridade', lead.getString('prioridade') || 'Média')

        if (
          body.valor_estimado !== undefined &&
          body.valor_estimado !== null &&
          body.valor_estimado !== ''
        ) {
          negocio.set('valor_estimado', Number(body.valor_estimado))
        }

        negocio.set('probabilidade', 10)

        const closingDate = new Date(now)
        closingDate.setDate(closingDate.getDate() + 30)
        negocio.set(
          'data_prevista_fechamento',
          closingDate.toISOString().split('.')[0].replace('T', ' ') + 'Z',
        )

        txApp.save(negocio)

        lead.set('status', 'Convertido')
        lead.set('cliente_id', cliente.id)

        txApp.save(lead)

        result = {
          success: true,
          cliente_id: cliente.id,
          negocio_id: negocio.id,
        }
      })
    } catch (err) {
      if (conflictResponse) {
        return e.json(409, conflictResponse)
      }
      if (customError) throw customError
      throw new BadRequestError(err.message || 'Erro interno ao converter lead')
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)

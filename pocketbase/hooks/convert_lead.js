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
      s = s.replace(/[^\w\s]/gi, '')
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

        const rsClientes = txApp.db().newQuery('SELECT id, nome FROM clientes').all() || []
        for (const r of rsClientes) {
          if (normalize(r.nome) === normalizedNewName) {
            duplicates.push(`Nome similar encontrado em Clientes: ${r.nome}`)
            break
          }
        }

        if (leadEmail) {
          const rsEmail =
            txApp
              .db()
              .newQuery(`
            SELECT contatos.id, clientes.nome
            FROM contatos
            JOIN clientes ON clientes.id = contatos.cliente_id
            WHERE LOWER(TRIM(contatos.email)) = LOWER(TRIM({:email}))
            LIMIT 1
          `)
              .bind({ email: leadEmail })
              .all() || []
          if (rsEmail.length > 0) {
            duplicates.push(
              `E-mail já existente em Clientes: ${leadEmail} (Cliente: ${rsEmail[0].nome})`,
            )
          }
        }

        if (normalizedPhone) {
          const rsPhone =
            txApp
              .db()
              .newQuery(`
            SELECT contatos.telefone, clientes.nome
            FROM contatos
            JOIN clientes ON clientes.id = contatos.cliente_id
            WHERE contatos.telefone != "" AND contatos.telefone IS NOT NULL
          `)
              .all() || []
          for (const r of rsPhone) {
            if (r.telefone.replace(/\D/g, '') === normalizedPhone) {
              duplicates.push(
                `Telefone já existente em Clientes: ${leadPhone} (Cliente: ${r.nome})`,
              )
              break
            }
          }
        }

        const rsLeads =
          txApp
            .db()
            .newQuery('SELECT id, nome, email, telefone FROM leads WHERE id != {:id}')
            .bind({ id: lead.id })
            .all() || []
        for (const r of rsLeads) {
          if (normalize(r.nome) === normalizedNewName) {
            duplicates.push(`Nome similar encontrado em outro Lead: ${r.nome}`)
            break
          }
        }

        if (leadEmail) {
          for (const r of rsLeads) {
            if (r.email && r.email.toLowerCase().trim() === leadEmail.toLowerCase().trim()) {
              duplicates.push(`E-mail já existente em outro Lead: ${r.email}`)
              break
            }
          }
        }

        if (normalizedPhone) {
          for (const r of rsLeads) {
            if (r.telefone && r.telefone.replace(/\D/g, '') === normalizedPhone) {
              duplicates.push(`Telefone já existente em outro Lead: ${r.telefone}`)
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
        negocio.set('status', 'Qualificação')
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

routerAdd(
  'POST',
  '/backend/v1/convert-lead',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.lead_id) {
      throw new BadRequestError('Missing lead_id')
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

        let duplicates = []

        try {
          const rs = txApp
            .db()
            .newQuery(
              'SELECT id FROM clientes WHERE LOWER(TRIM(nome)) = LOWER(TRIM({:nome})) LIMIT 1',
            )
            .bind({ nome: novoNomeCliente })
            .all()
          if (rs && rs.length > 0) duplicates.push('Já existe um cliente com este nome.')
        } catch (_) {}

        let leadEmail = lead.getString('email')
        let leadPhone = lead.getString('telefone')

        if (leadEmail) {
          try {
            const rs = txApp
              .db()
              .newQuery(
                'SELECT id FROM contatos WHERE LOWER(TRIM(email)) = LOWER(TRIM({:email})) LIMIT 1',
              )
              .bind({ email: leadEmail })
              .all()
            if (rs && rs.length > 0)
              duplicates.push('Um cliente existente foi encontrado com este e-mail.')
          } catch (_) {}
        }

        if (leadPhone) {
          try {
            const rs = txApp
              .db()
              .newQuery('SELECT id FROM contatos WHERE TRIM(telefone) = TRIM({:phone}) LIMIT 1')
              .bind({ phone: leadPhone })
              .all()
            if (rs && rs.length > 0)
              duplicates.push('Um cliente existente foi encontrado com este telefone.')
          } catch (_) {}
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

        try {
          txApp.save(cliente)
        } catch (err) {
          customError = new BadRequestError('Erro ao criar cliente. Verifique os dados.', {
            error: err.message,
          })
          throw err
        }

        const contatosCol = txApp.findCollectionByNameOrId('contatos')
        const contato = new Record(contatosCol)
        contato.set('cliente_id', cliente.id)
        contato.set('nome', lead.getString('contato_nome') || lead.getString('nome'))
        if (lead.getString('email')) contato.set('email', lead.getString('email'))
        if (lead.getString('telefone')) contato.set('telefone', lead.getString('telefone'))
        contato.set('is_principal', true)

        try {
          txApp.save(contato)
        } catch (err) {
          customError = new BadRequestError('Erro ao criar contato.', { error: err.message })
          throw err
        }

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

        try {
          txApp.save(negocio)
        } catch (err) {
          customError = new BadRequestError('Erro ao criar negócio.', { error: err.message })
          throw err
        }

        lead.set('status', 'Convertido')
        lead.set('cliente_id', cliente.id)
        try {
          txApp.save(lead)
        } catch (err) {
          customError = new BadRequestError('Erro ao atualizar lead.', { error: err.message })
          throw err
        }

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

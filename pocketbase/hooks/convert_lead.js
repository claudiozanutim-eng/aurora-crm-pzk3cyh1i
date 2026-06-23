routerAdd(
  'POST',
  '/backend/v1/convert-lead',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.lead_id) {
      throw new BadRequestError('Missing lead_id')
    }

    let result
    try {
      $app.runInTransaction((txApp) => {
        let lead
        try {
          lead = txApp.findRecordById('leads', body.lead_id)
        } catch (_) {
          throw new NotFoundError('Lead not found')
        }

        let clienteExists = false
        try {
          txApp.findFirstRecordByData('clientes', 'nome', lead.getString('nome'))
          clienteExists = true
        } catch (_) {
          // Not found, continue execution safely
        }

        if (clienteExists) {
          throw new BadRequestError('Erro: Já existe um cliente cadastrado com este nome.', {
            nome: 'Já existe um cliente cadastrado com este nome.',
          })
        }

        const clientesCol = txApp.findCollectionByNameOrId('clientes')
        const cliente = new Record(clientesCol)
        cliente.set('nome', lead.getString('nome'))
        cliente.set('tipo', lead.getString('tipo'))
        cliente.set('segmento', lead.getString('segmento'))
        cliente.set('status', 'Ativo')

        const now = new Date()
        cliente.set('data_cadastro', now.toISOString())
        cliente.set('porte', 'Pequeno')
        txApp.save(cliente)

        const contatosCol = txApp.findCollectionByNameOrId('contatos')
        const contato = new Record(contatosCol)
        contato.set('cliente_id', cliente.id)
        contato.set('nome', lead.getString('contato_nome') || lead.getString('nome'))
        if (lead.getString('email')) contato.set('email', lead.getString('email'))
        if (lead.getString('telefone')) contato.set('telefone', lead.getString('telefone'))
        contato.set('is_principal', true)
        txApp.save(contato)

        const negociosCol = txApp.findCollectionByNameOrId('negocios')
        const negocio = new Record(negociosCol)
        negocio.set('cliente_id', cliente.id)
        negocio.set('vendedor_id', lead.getString('vendedor_id'))
        negocio.set('status', 'Qualificação')
        negocio.set('prioridade', lead.getString('prioridade'))

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
        negocio.set('data_prevista_fechamento', closingDate.toISOString())
        txApp.save(negocio)

        lead.set('status', 'Convertido')
        txApp.save(lead)

        result = { success: true, cliente_id: cliente.id, negocio_id: negocio.id }
      })
    } catch (err) {
      if (err.status) {
        throw err
      }
      throw new BadRequestError(err.message || 'Erro ao converter lead')
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)

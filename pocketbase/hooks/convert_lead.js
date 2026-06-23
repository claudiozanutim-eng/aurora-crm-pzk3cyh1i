routerAdd(
  'POST',
  '/backend/v1/convert-lead',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.lead_id) {
      throw new BadRequestError('Missing lead_id')
    }

    let result
    $app.runInTransaction((txApp) => {
      let lead
      try {
        lead = txApp.findRecordById('leads', body.lead_id)
      } catch (_) {
        throw new NotFoundError('Lead not found')
      }

      try {
        txApp.findFirstRecordByData('clientes', 'nome', lead.getString('nome'))
        // If found, it means it's a duplicate
        const errors = {
          nome: new ValidationError(
            'validation_not_unique',
            'Já existe um cliente cadastrado com este nome.',
          ),
        }
        throw new BadRequestError('Erro: Já existe um cliente cadastrado com este nome.', errors)
      } catch (err) {
        if (err instanceof BadRequestError) {
          throw err
        }
        // Not found, continue execution safely
      }

      const clientesCol = txApp.findCollectionByNameOrId('clientes')
      const cliente = new Record(clientesCol)
      cliente.set('nome', lead.getString('nome'))
      cliente.set('tipo', lead.getString('tipo'))
      cliente.set('segmento', lead.getString('segmento'))
      cliente.set('status', 'Ativo')

      const now = new Date()
      // data_cadastro is date field: "YYYY-MM-DD HH:mm:ss.SSSZ"
      cliente.set('data_cadastro', now.toISOString().replace('T', ' '))
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
      negocio.set('status', 'Prospecção')
      negocio.set('prioridade', lead.getString('prioridade'))
      negocio.set('valor_estimado', 0)
      negocio.set('probabilidade', 10)

      const closingDate = new Date(now)
      closingDate.setDate(closingDate.getDate() + 30)
      negocio.set('data_prevista_fechamento', closingDate.toISOString().replace('T', ' '))
      txApp.save(negocio)

      lead.set('status', 'Convertido')
      txApp.save(lead)

      result = { success: true, cliente_id: cliente.id, negocio_id: negocio.id }
    })

    return e.json(200, result)
  },
  $apis.requireAuth(),
)

migrate(
  (app) => {
    let user, cliente
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'luizfelipe.pateo@iceduc.com.br')
    } catch (e) {
      return
    }

    try {
      const clientes = app.findRecordsByFilter('clientes', "status='Ativo'", '-created', 1, 0)
      if (!clientes || clientes.length === 0) return
      cliente = clientes[0]
    } catch (e) {
      return
    }

    const tarefasCol = app.findCollectionByNameOrId('tarefas')

    const now = new Date()

    const d1 = new Date(now)
    d1.setDate(d1.getDate() - 4)

    const d2 = new Date(now)
    d2.setHours(d2.getHours() + 1)

    const d3 = new Date(now)
    d3.setDate(d3.getDate() + 3)

    const seeds = [
      {
        descricao: 'Follow-up de proposta enviada (Dash Seed)',
        data_limite: d1.toISOString(),
        prioridade: 'Alta',
        status: 'Atrasada',
        tipo: 'WhatsApp',
      },
      {
        descricao: 'Reunião de apresentação (Dash Seed)',
        data_limite: d2.toISOString(),
        prioridade: 'Média',
        status: 'Pendente',
        tipo: 'Reunião',
      },
      {
        descricao: 'Ligar para confirmar interesse (Dash Seed)',
        data_limite: d3.toISOString(),
        prioridade: 'Baixa',
        status: 'Pendente',
        tipo: 'Telefonema',
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('tarefas', 'descricao', s.descricao)
      } catch (e) {
        const record = new Record(tarefasCol)
        record.set('vendedor_id', user.id)
        record.set('cliente_id', cliente.id)
        record.set('descricao', s.descricao)
        record.set('data_limite', s.data_limite)
        record.set('prioridade', s.prioridade)
        record.set('status', s.status)
        record.set('tipo', s.tipo)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM tarefas WHERE descricao LIKE '%(Dash Seed)'").execute()
    } catch (e) {}
  },
)

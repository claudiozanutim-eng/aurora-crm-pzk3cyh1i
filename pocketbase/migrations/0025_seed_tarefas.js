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

    try {
      app.findFirstRecordByData(
        'tarefas',
        'descricao',
        'Ligar para confirmar recebimento da proposta (Seed)',
      )
      return // Already seeded
    } catch (e) {}

    const now = new Date()

    const d1 = new Date(now)
    d1.setDate(d1.getDate() - 2)
    const d2 = new Date(now)
    d2.setDate(d2.getDate() - 1)
    const d3 = new Date(now)
    d3.setHours(d3.getHours() + 2)
    const d4 = new Date(now)
    d4.setDate(d4.getDate() + 1)
    const d5 = new Date(now)
    d5.setDate(d5.getDate() + 5)

    const seeds = [
      {
        descricao: 'Ligar para confirmar recebimento da proposta (Seed)',
        data_limite: d1.toISOString(),
        prioridade: 'Alta',
        status: 'Pendente',
        tipo: 'Telefonema',
      },
      {
        descricao: 'Atualizar dados cadastrais do cliente (Seed)',
        data_limite: d2.toISOString(),
        prioridade: 'Média',
        status: 'Concluída',
        tipo: 'WhatsApp',
      },
      {
        descricao: 'Enviar apresentação institucional por email (Seed)',
        data_limite: d3.toISOString(),
        prioridade: 'Alta',
        status: 'Em andamento',
        tipo: 'E-mail',
      },
      {
        descricao: 'Reunião de alinhamento com a diretoria (Seed)',
        data_limite: d4.toISOString(),
        prioridade: 'Média',
        status: 'Pendente',
        tipo: 'Reunião',
      },
      {
        descricao: 'Follow-up mensal de acompanhamento (Seed)',
        data_limite: d5.toISOString(),
        prioridade: 'Baixa',
        status: 'Pendente',
        tipo: 'WhatsApp',
      },
    ]

    for (const s of seeds) {
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
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM tarefas WHERE descricao LIKE '%(Seed)'").execute()
    } catch (e) {}
  },
)

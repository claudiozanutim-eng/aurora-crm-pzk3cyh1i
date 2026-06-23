migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    let userId = null
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'luizfelipe.pateo@iceduc.com.br')
      userId = user.id
    } catch (_) {
      try {
        const anyUser = app.findFirstRecordByFilter('_pb_users_auth_', '1=1')
        userId = anyUser.id
      } catch (_) {
        return // no user to associate
      }
    }

    const seedData = [
      {
        nome: 'Escola Futuro',
        contato_nome: 'Maria Silva',
        telefone: '11999999999',
        email: 'maria@escolafuturo.com',
        tipo: 'PJ',
        origem: 'Site',
        segmento: 'Educação',
        prioridade: 'Alta',
        status: 'Novos Leads',
        vendedor_id: userId,
      },
      {
        nome: 'João Silva',
        contato_nome: 'João Silva',
        telefone: '11888888888',
        email: 'joao@silva.com',
        tipo: 'PF',
        origem: 'Indicação',
        segmento: 'Serviços',
        prioridade: 'Média',
        status: 'Primeiro Contato',
        vendedor_id: userId,
      },
      {
        nome: 'Tech Soluções',
        contato_nome: 'Carlos Sousa',
        telefone: '11777777777',
        email: 'carlos@tech.com',
        tipo: 'PJ',
        origem: 'Redes Sociais',
        segmento: 'Tecnologia',
        prioridade: 'Baixa',
        status: 'Qualificando',
        vendedor_id: userId,
      },
      {
        nome: 'Agro S.A.',
        contato_nome: 'Ana Costa',
        telefone: '11666666666',
        email: 'ana@agro.com',
        tipo: 'PJ',
        origem: 'Evento',
        segmento: 'Agro',
        prioridade: 'Alta',
        status: 'Não Qualificado',
        vendedor_id: userId,
      },
    ]

    for (const data of seedData) {
      try {
        app.findFirstRecordByData('leads', 'nome', data.nome)
      } catch (_) {
        const record = new Record(leads)
        for (const [k, v] of Object.entries(data)) {
          record.set(k, v)
        }
        app.save(record)
      }
    }
  },
  (app) => {
    const seedNames = ['Escola Futuro', 'João Silva', 'Tech Soluções', 'Agro S.A.']
    for (const name of seedNames) {
      try {
        const record = app.findFirstRecordByData('leads', 'nome', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)

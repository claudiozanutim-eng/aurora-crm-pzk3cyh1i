migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    const contatos = app.findCollectionByNameOrId('contatos')

    const seeds = [
      {
        cliente: {
          tipo: 'PJ',
          nome: 'Escola Futuro Ltda',
          nome_fantasia: 'Futuro Educ',
          documento: '12.345.678/0001-99',
          segmento: 'Educação',
          porte: 'Médio',
          status: 'Ativo',
          data_cadastro: '2023-10-01 12:00:00.000Z',
        },
        contato: {
          nome: 'Maria Silva',
          email: 'maria@futuroeduc.com.br',
          telefone: '(11) 99999-9999',
          cargo: 'Diretora',
          is_principal: true,
        },
      },
      {
        cliente: {
          tipo: 'PF',
          nome: 'João da Silva',
          documento: '111.222.333-44',
          segmento: 'Tecnologia',
          porte: 'Micro',
          status: 'Lead',
          data_cadastro: '2023-10-02 12:00:00.000Z',
        },
        contato: {
          nome: 'João da Silva',
          email: 'joao@email.com',
          telefone: '(11) 98888-8888',
          is_principal: true,
        },
      },
      {
        cliente: {
          tipo: 'PJ',
          nome: 'Varejo Total S.A.',
          nome_fantasia: 'Total Shop',
          documento: '98.765.432/0001-00',
          segmento: 'Varejo',
          porte: 'Grande',
          status: 'Ativo',
          data_cadastro: '2023-10-03 12:00:00.000Z',
        },
        contato: {
          nome: 'Carlos Souza',
          email: 'carlos@totalshop.com.br',
          telefone: '(11) 97777-7777',
          cargo: 'Gerente',
          is_principal: true,
        },
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('clientes', 'documento', s.cliente.documento)
        continue
      } catch (_) {}

      const cliRecord = new Record(clientes)
      cliRecord.set('tipo', s.cliente.tipo)
      cliRecord.set('nome', s.cliente.nome)
      if (s.cliente.nome_fantasia) cliRecord.set('nome_fantasia', s.cliente.nome_fantasia)
      cliRecord.set('documento', s.cliente.documento)
      cliRecord.set('segmento', s.cliente.segmento)
      cliRecord.set('porte', s.cliente.porte)
      cliRecord.set('status', s.cliente.status)
      cliRecord.set('data_cadastro', s.cliente.data_cadastro)
      app.save(cliRecord)

      const conRecord = new Record(contatos)
      conRecord.set('cliente_id', cliRecord.id)
      conRecord.set('nome', s.contato.nome)
      conRecord.set('email', s.contato.email)
      conRecord.set('telefone', s.contato.telefone)
      if (s.contato.cargo) conRecord.set('cargo', s.contato.cargo)
      conRecord.set('is_principal', s.contato.is_principal)
      app.save(conRecord)
    }
  },
  (app) => {},
)

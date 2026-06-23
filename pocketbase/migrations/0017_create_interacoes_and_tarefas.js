migrate(
  (app) => {
    const interacoes = new Collection({
      name: 'interacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          required: false,
          maxSelect: 1,
        },
        {
          name: 'lead_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('leads').id,
          required: false,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['E-mail', 'WhatsApp', 'Telefonema', 'Reunião', 'Proposta Enviada'],
          maxSelect: 1,
        },
        { name: 'data_hora', type: 'date', required: true },
        {
          name: 'vendedor_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'resumo', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_interacoes_cliente ON interacoes (cliente_id)',
        'CREATE INDEX idx_interacoes_lead ON interacoes (lead_id)',
      ],
    })
    app.save(interacoes)

    const tarefas = new Collection({
      name: 'tarefas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          required: false,
          maxSelect: 1,
        },
        {
          name: 'lead_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('leads').id,
          required: false,
          maxSelect: 1,
        },
        {
          name: 'vendedor_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'data_limite', type: 'date', required: true },
        {
          name: 'prioridade',
          type: 'select',
          required: true,
          values: ['Alta', 'Média', 'Baixa'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em andamento', 'Concluída', 'Atrasada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tarefas_cliente ON tarefas (cliente_id)',
        'CREATE INDEX idx_tarefas_lead ON tarefas (lead_id)',
        'CREATE INDEX idx_tarefas_status ON tarefas (status)',
      ],
    })
    app.save(tarefas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('tarefas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('interacoes'))
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'contato_nome', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'tipo', type: 'select', required: true, values: ['PF', 'PJ'], maxSelect: 1 },
        {
          name: 'origem',
          type: 'select',
          required: true,
          values: ['Indicação', 'Site', 'Redes Sociais', 'Evento', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'segmento',
          type: 'select',
          required: true,
          values: [
            'Educação',
            'Tecnologia',
            'Varejo',
            'Agro',
            'Indústria',
            'Serviços',
            'Cooperativa',
            'Outro',
          ],
          maxSelect: 1,
        },
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
          values: [
            'Novos Leads',
            'Primeiro Contato',
            'Qualificando',
            'Não Qualificado',
            'Convertido',
          ],
          maxSelect: 1,
        },
        {
          name: 'vendedor_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_status ON leads (status)',
        'CREATE INDEX idx_leads_vendedor_id ON leads (vendedor_id)',
      ],
    })
    app.save(leads)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('leads'))
    } catch (_) {}
  },
)

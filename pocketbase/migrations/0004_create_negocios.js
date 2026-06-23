migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')

    const negocios = new Collection({
      name: 'negocios',
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
          required: true,
          collectionId: clientes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor_estimado', type: 'number', required: true, min: 0 },
        { name: 'probabilidade', type: 'number', min: 0, max: 100 },
        { name: 'data_prevista_fechamento', type: 'date' },
        { name: 'data_fechamento_real', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'Prospecção',
            'Qualificação',
            'Proposta Enviada',
            'Negociação',
            'Fechado/Ganho',
            'Perdido',
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
        { name: 'descricao', type: 'text' },
        { name: 'ciclo_vendas_dias', type: 'number', min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_negocios_cliente_id ON negocios (cliente_id)',
        'CREATE INDEX idx_negocios_status ON negocios (status)',
      ],
    })

    app.save(negocios)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('negocios'))
    } catch (_) {}
  },
)

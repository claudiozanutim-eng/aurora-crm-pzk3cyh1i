migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    const negocios = app.findCollectionByNameOrId('negocios')

    const propostas = new Collection({
      name: 'propostas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: clientes.id,
          maxSelect: 1,
        },
        {
          name: 'negocio_id',
          type: 'relation',
          required: false,
          collectionId: negocios.id,
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: true, min: 0 },
        { name: 'descricao_servicos', type: 'text', required: true },
        { name: 'condicoes_comerciais', type: 'text', required: true },
        { name: 'validade_dias', type: 'number', required: true, min: 1 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Enviada', 'Aprovada', 'Rejeitada', 'Expirada'],
          maxSelect: 1,
        },
        { name: 'data_envio', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_propostas_cliente_id ON propostas (cliente_id)',
        'CREATE INDEX idx_propostas_status ON propostas (status)',
        'CREATE INDEX idx_propostas_titulo ON propostas (titulo)',
      ],
    })

    app.save(propostas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('propostas'))
    } catch (_) {}
  },
)

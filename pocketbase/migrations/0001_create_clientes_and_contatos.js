migrate(
  (app) => {
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tipo', type: 'select', required: true, values: ['PF', 'PJ'], maxSelect: 1 },
        { name: 'documento', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'nome_fantasia', type: 'text' },
        {
          name: 'segmento',
          type: 'select',
          required: true,
          values: ['Educação', 'Tecnologia', 'Varejo', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'porte',
          type: 'select',
          required: true,
          values: ['Micro', 'Pequeno', 'Médio', 'Grande'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo', 'Lead'],
          maxSelect: 1,
        },
        { name: 'data_cadastro', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_clientes_documento ON clientes (documento)',
        'CREATE INDEX idx_clientes_nome ON clientes (nome)',
        'CREATE INDEX idx_clientes_status ON clientes (status)',
        'CREATE INDEX idx_clientes_tipo ON clientes (tipo)',
      ],
    })
    app.save(clientes)

    const contatos = new Collection({
      name: 'contatos',
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
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'telefone', type: 'text', required: true },
        { name: 'cargo', type: 'text' },
        { name: 'data_aniversario', type: 'date' },
        { name: 'is_principal', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contatos_cliente_id ON contatos (cliente_id)'],
    })
    app.save(contatos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('contatos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('clientes'))
    } catch (_) {}
  },
)

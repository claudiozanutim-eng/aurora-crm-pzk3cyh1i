migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var auditoria = new Collection({
      name: 'auditoria',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      viewRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        { name: 'acao', type: 'text', required: true },
        { name: 'recurso', type: 'text', required: true },
        { name: 'detalhes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_auditoria_usuario_id ON auditoria (usuario_id)',
        'CREATE INDEX idx_auditoria_created ON auditoria (created)',
      ],
    })

    app.save(auditoria)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('auditoria'))
    } catch (_) {}
  },
)

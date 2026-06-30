migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var backups = new Collection({
      name: 'backups',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      viewRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      createRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      updateRule: null,
      deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'Admin'",
      fields: [
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/json', 'application/zip'],
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Manual', 'Automático - Exclusão'],
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        { name: 'tamanho', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_backups_usuario_id ON backups (usuario_id)',
        'CREATE INDEX idx_backups_created ON backups (created)',
      ],
    })

    app.save(backups)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('backups'))
    } catch (_) {}
  },
)

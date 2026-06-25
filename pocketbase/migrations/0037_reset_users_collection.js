migrate(
  (app) => {
    const negocios = app.findCollectionByNameOrId('negocios')
    const leads = app.findCollectionByNameOrId('leads')
    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tarefas = app.findCollectionByNameOrId('tarefas')

    try {
      const usersCol = app.findCollectionByNameOrId('users')
      app.delete(usersCol)
    } catch (_) {}

    const newUsers = new Collection({
      id: '_pb_users_auth_',
      name: 'users',
      type: 'auth',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'perfil', type: 'select', values: ['Admin', 'Usuário'], maxSelect: 1 },
        { name: 'requer_troca_senha', type: 'bool' },
      ],
    })

    if (newUsers.passwordAuth) {
      newUsers.passwordAuth.enabled = true
      newUsers.passwordAuth.identityFields = ['email']
    }

    app.save(newUsers)

    const reAddRelation = (col) => {
      if (col && !col.fields.getByName('vendedor_id')) {
        col.fields.add(
          new RelationField({
            name: 'vendedor_id',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          }),
        )
        app.save(col)
      }
    }

    reAddRelation(negocios)
    reAddRelation(leads)
    reAddRelation(interacoes)
    reAddRelation(tarefas)

    const seedData = [
      { email: 'admin@test.com', password: '12345678', name: 'Admin', perfil: 'Admin' },
      { email: 'user1@test.com', password: '12345678', name: 'User 1', perfil: 'Usuário' },
      { email: 'user2@test.com', password: '12345678', name: 'User 2', perfil: 'Usuário' },
    ]

    for (const u of seedData) {
      try {
        app.findAuthRecordByEmail('users', u.email)
      } catch (_) {
        const record = new Record(newUsers)
        record.setEmail(u.email)
        record.setPassword(u.password)
        record.setVerified(true)
        record.set('name', u.name)
        record.set('ativo', true)
        record.set('perfil', u.perfil)
        record.set('requer_troca_senha', false)
        app.save(record)
      }
    }
  },
  (app) => {
    // Irreversible structural reset
  },
)

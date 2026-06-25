migrate(
  (app) => {
    const negocios = app.findCollectionByNameOrId('negocios')
    const leads = app.findCollectionByNameOrId('leads')
    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tarefas = app.findCollectionByNameOrId('tarefas')

    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      try {
        usersCol = app.findCollectionByNameOrId('users')
      } catch (_) {
        usersCol = new Collection({
          id: '_pb_users_auth_',
          name: 'users',
          type: 'auth',
        })
      }
    }

    usersCol.listRule = ''
    usersCol.viewRule = ''
    usersCol.createRule = ''
    usersCol.updateRule = ''
    usersCol.deleteRule = ''

    if (!usersCol.fields.getByName('name')) {
      usersCol.fields.add(new TextField({ name: 'name' }))
    }
    if (!usersCol.fields.getByName('ativo')) {
      usersCol.fields.add(new BoolField({ name: 'ativo' }))
    }
    if (!usersCol.fields.getByName('perfil')) {
      usersCol.fields.add(
        new SelectField({ name: 'perfil', values: ['Admin', 'Usuário'], maxSelect: 1 }),
      )
    }
    if (!usersCol.fields.getByName('requer_troca_senha')) {
      usersCol.fields.add(new BoolField({ name: 'requer_troca_senha' }))
    }

    if (usersCol.passwordAuth) {
      usersCol.passwordAuth.enabled = true
      usersCol.passwordAuth.identityFields = ['email']
    }

    app.save(usersCol)

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
        const record = new Record(usersCol)
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

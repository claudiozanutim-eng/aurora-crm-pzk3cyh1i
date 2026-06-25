migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (usersCol.oauth2) {
      usersCol.oauth2.enabled = false
      usersCol.oauth2.providers = []
    }

    if (usersCol.passwordAuth) {
      usersCol.passwordAuth.enabled = true
      usersCol.passwordAuth.identityFields = ['email']
    }

    usersCol.listRule = ''
    usersCol.viewRule = ''
    usersCol.createRule = ''
    usersCol.updateRule = ''
    usersCol.deleteRule = ''

    app.save(usersCol)

    const email = 'luizfelipe.pateo@iceduc.com.br'
    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', email)
      existing.setVerified(true)
      existing.set('ativo', true)
      app.save(existing)
    } catch (_) {
      const record = new Record(usersCol)
      record.setEmail(email)
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Luiz Felipe Pateo')
      record.set('ativo', true)
      record.set('perfil', 'Admin')
      record.set('requer_troca_senha', false)
      app.save(record)
    }
  },
  (app) => {
    // Revert not strictly necessary for this use case
  },
)

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'luizfelipe.pateo@iceduc.com.br')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('luizfelipe.pateo@iceduc.com.br')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin IC Educ')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'luizfelipe.pateo@iceduc.com.br')
      app.delete(record)
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      // If user exists, update password, verified status, and custom fields
      const record = app.findAuthRecordByEmail('users', 'luizfelipe.pateo@iceduc.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('ativo', true)

      // Ensure perfil is set to Admin for the default user
      if (!record.get('perfil')) {
        record.set('perfil', 'Admin')
      }

      app.save(record)
    } catch (_) {
      // If user doesn't exist, create it from scratch
      const record = new Record(users)
      record.setEmail('luizfelipe.pateo@iceduc.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin IC Educ')
      record.set('ativo', true)
      record.set('perfil', 'Admin')
      app.save(record)
    }
  },
  (app) => {
    // No down migration needed for data fixes to prevent accidental lockout
  },
)

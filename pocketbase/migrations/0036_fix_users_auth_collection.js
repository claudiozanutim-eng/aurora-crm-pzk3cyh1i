migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    // Ensure collection is configured as an auth type
    col.type = 'auth'

    // Remove any explicit restrictive auth rules that might block the internal handshake
    if (col.authRule !== undefined) {
      col.authRule = ''
    }

    // Set API rules to be accessible per project requirements
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != '' || id = @request.auth.id"
    col.createRule = "@request.auth.perfil = 'Admin'"
    col.updateRule = "@request.auth.perfil = 'Admin' || id = @request.auth.id"
    col.deleteRule = "@request.auth.perfil = 'Admin'"

    // Validate and ensure all essential schema fields exist
    if (!col.fields.getByName('email')) {
      col.fields.add(new EmailField({ name: 'email', required: true }))
    }
    if (!col.fields.getByName('password')) {
      col.fields.add(new PasswordField({ name: 'password', required: true }))
    }
    if (!col.fields.getByName('name')) {
      col.fields.add(new TextField({ name: 'name' }))
    }
    if (!col.fields.getByName('verified')) {
      col.fields.add(new BoolField({ name: 'verified' }))
    }
    if (!col.fields.getByName('ativo')) {
      col.fields.add(new BoolField({ name: 'ativo' }))
    }
    if (!col.fields.getByName('perfil')) {
      col.fields.add(new SelectField({ name: 'perfil', values: ['Admin', 'Usuário'] }))
    }
    if (!col.fields.getByName('requer_troca_senha')) {
      col.fields.add(new BoolField({ name: 'requer_troca_senha' }))
    }

    // Ensure password auth is enabled if the option is exposed in this structure
    if (col.passwordAuth) {
      col.passwordAuth.enabled = true
      if (!col.passwordAuth.identityFields || col.passwordAuth.identityFields.length === 0) {
        col.passwordAuth.identityFields = ['email']
      }
    }

    app.save(col)

    // Seed Data Recovery - ensure the primary user is active, verified, and has the correct password
    try {
      const record = app.findAuthRecordByEmail('users', 'luizfelipe.pateo@iceduc.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('ativo', true)
      if (!record.get('perfil')) {
        record.set('perfil', 'Admin')
      }
      app.save(record)
    } catch (_) {
      const record = new Record(col)
      record.setEmail('luizfelipe.pateo@iceduc.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin IC Educ')
      record.set('ativo', true)
      record.set('perfil', 'Admin')
      record.set('requer_troca_senha', false)
      app.save(record)
    }
  },
  (app) => {
    // Safe down migration — no data deletion
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('perfil')) {
      col.fields.add(
        new SelectField({
          name: 'perfil',
          values: ['Admin', 'Usuário'],
          required: false,
        }),
      )
    }

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.perfil = 'Admin'"
    col.updateRule = "@request.auth.perfil = 'Admin' || id = @request.auth.id"
    col.deleteRule = "@request.auth.perfil = 'Admin'"

    app.save(col)

    app
      .db()
      .newQuery("UPDATE users SET perfil = 'Admin' WHERE perfil IS NULL OR perfil = ''")
      .execute()

    const updatedCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = updatedCol.fields.getByName('perfil')
    field.required = true
    app.save(updatedCol)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('perfil')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'
    app.save(col)
  },
)

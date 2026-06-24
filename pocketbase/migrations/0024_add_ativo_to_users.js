migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('ativo')) {
      col.fields.add(new BoolField({ name: 'ativo' }))
    }
    app.save(col)

    app.db().newQuery('UPDATE users SET ativo = 1 WHERE ativo IS NULL OR ativo = 0').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (col.fields.getByName('ativo')) {
      col.fields.removeByName('ativo')
    }
    app.save(col)
  },
)

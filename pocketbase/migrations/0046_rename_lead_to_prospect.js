migrate(
  (app) => {
    app.db().newQuery("UPDATE clientes SET status = 'Prospect' WHERE status = 'Lead'").execute()

    const col = app.findCollectionByNameOrId('clientes')
    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        values: ['Ativo', 'Inativo', 'Prospect'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    app.db().newQuery("UPDATE clientes SET status = 'Lead' WHERE status = 'Prospect'").execute()

    const col = app.findCollectionByNameOrId('clientes')
    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        values: ['Ativo', 'Inativo', 'Lead'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)

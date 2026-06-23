migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    if (!col.fields.getByName('data_conversao')) {
      col.fields.add(
        new DateField({
          name: 'data_conversao',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    if (col.fields.getByName('data_conversao')) {
      col.fields.removeByName('data_conversao')
      app.save(col)
    }
  },
)

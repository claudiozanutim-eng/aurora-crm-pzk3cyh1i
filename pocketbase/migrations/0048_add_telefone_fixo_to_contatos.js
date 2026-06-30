migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')
    if (!col.fields.getByName('telefone_fixo')) {
      col.fields.add(new TextField({ name: 'telefone_fixo' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')
    const field = col.fields.getByName('telefone_fixo')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)

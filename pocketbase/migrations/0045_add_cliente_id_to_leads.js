migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (!col.fields.getByName('cliente_id')) {
      col.fields.add(
        new RelationField({
          name: 'cliente_id',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    col.fields.removeByName('cliente_id')
    app.save(col)
  },
)

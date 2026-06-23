migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.add(
      new RelationField({
        name: 'vendedor_id',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        required: true,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.removeByName('vendedor_id')
    app.save(col)
  },
)

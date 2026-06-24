migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('propostas')
    collection.fields.add(new DateField({ name: 'validade_ate', required: false }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('propostas')
    collection.fields.removeByName('validade_ate')
    app.save(collection)
  },
)

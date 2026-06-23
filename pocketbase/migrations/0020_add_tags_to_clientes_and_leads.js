migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.add(new JSONField({ name: 'tags' }))
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.add(new JSONField({ name: 'tags' }))
    app.save(leads)
  },
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.removeByName('tags')
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.removeByName('tags')
    app.save(leads)
  },
)

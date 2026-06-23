migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.add(new TextField({ name: 'observacoes' }))
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.add(new TextField({ name: 'observacoes' }))
    app.save(leads)
  },
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.removeByName('observacoes')
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.removeByName('observacoes')
    app.save(leads)
  },
)

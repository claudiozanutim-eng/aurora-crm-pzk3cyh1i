migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE negocios SET status = 'Prospect' WHERE status = 'Prospecção'")
      .execute()

    const col = app.findCollectionByNameOrId('negocios')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Prospect',
        'Proposta Enviada',
        'Negociação',
        'Fechado/Ganho',
        'Perdido',
      ]
    }
    app.save(col)
  },
  (app) => {
    app
      .db()
      .newQuery("UPDATE negocios SET status = 'Prospecção' WHERE status = 'Prospect'")
      .execute()

    const col = app.findCollectionByNameOrId('negocios')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Prospecção',
        'Prospect',
        'Proposta Enviada',
        'Negociação',
        'Fechado/Ganho',
        'Perdido',
      ]
    }
    app.save(col)
  },
)

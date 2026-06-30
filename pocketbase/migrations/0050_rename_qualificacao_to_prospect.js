migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE negocios SET status = 'Prospect' WHERE status = 'Qualificação'")
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
  (app) => {
    app
      .db()
      .newQuery("UPDATE negocios SET status = 'Qualificação' WHERE status = 'Prospect'")
      .execute()

    const col = app.findCollectionByNameOrId('negocios')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Prospecção',
        'Qualificação',
        'Proposta Enviada',
        'Negociação',
        'Fechado/Ganho',
        'Perdido',
      ]
    }
    app.save(col)
  },
)

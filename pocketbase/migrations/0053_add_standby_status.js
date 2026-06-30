migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Prospect',
        'Proposta Enviada',
        'Negociação',
        'Stand By',
        'Fechado/Ganho',
        'Perdido',
      ]
    }
    app.save(col)
  },
  (app) => {
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
)

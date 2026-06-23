migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    const segField = col.fields.getByName('segmento')
    if (segField) {
      segField.values = [
        'Educação',
        'Tecnologia',
        'Varejo',
        'Agro',
        'Indústria',
        'Serviços',
        'Cooperativa',
        'Outro',
      ]
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    const segField = col.fields.getByName('segmento')
    if (segField) {
      segField.values = ['Educação', 'Tecnologia', 'Varejo', 'Outro']
    }
    app.save(col)
  },
)

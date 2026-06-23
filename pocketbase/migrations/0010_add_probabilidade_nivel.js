migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.add(
      new SelectField({
        name: 'probabilidade_nivel',
        values: ['Alta', 'Média', 'Baixa'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.removeByName('probabilidade_nivel')
    app.save(col)
  },
)

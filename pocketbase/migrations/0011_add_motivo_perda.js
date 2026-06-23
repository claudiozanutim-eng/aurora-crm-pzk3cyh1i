migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.add(
      new SelectField({
        name: 'motivo_perda',
        values: ['Desistiu do Projeto', 'Preço', 'Preferiu Concorrente', 'Cliente Sumiu'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    col.fields.removeByName('motivo_perda')
    app.save(col)
  },
)

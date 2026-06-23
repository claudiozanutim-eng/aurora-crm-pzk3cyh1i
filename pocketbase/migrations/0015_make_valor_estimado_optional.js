migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    const valor = col.fields.getByName('valor_estimado')
    if (valor) {
      valor.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('negocios')
    const valor = col.fields.getByName('valor_estimado')
    if (valor) {
      valor.required = true
      app.save(col)
    }
  },
)

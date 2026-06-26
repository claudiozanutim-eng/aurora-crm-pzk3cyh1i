/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes')

    const tipoField = col.fields.getByName('tipo')
    if (tipoField) {
      const vals = tipoField.values || []
      if (!vals.includes('Movimentação de Funil')) {
        tipoField.values = [...vals, 'Movimentação de Funil']
      }
    }

    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes')

    const tipoField = col.fields.getByName('tipo')
    if (tipoField) {
      const vals = tipoField.values || []
      tipoField.values = vals.filter((v) => v !== 'Movimentação de Funil')
    }

    const obsField = col.fields.getByName('observacoes')
    if (obsField) {
      col.fields.removeByName('observacoes')
    }

    app.save(col)
  },
)

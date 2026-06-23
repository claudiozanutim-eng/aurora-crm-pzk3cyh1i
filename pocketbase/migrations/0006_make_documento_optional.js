migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    const docField = col.fields.getByName('documento')
    if (docField) {
      docField.required = false
    }

    col.removeIndex('idx_clientes_documento')
    col.addIndex('idx_clientes_documento', true, 'documento', "documento != ''")

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    const docField = col.fields.getByName('documento')
    if (docField) {
      docField.required = true
    }

    col.removeIndex('idx_clientes_documento')
    col.addIndex('idx_clientes_documento', true, 'documento', '')

    app.save(col)
  },
)

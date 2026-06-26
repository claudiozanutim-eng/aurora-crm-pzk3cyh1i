migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.removeIndex('idx_clientes_nome_unique')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.addIndex('idx_clientes_nome_unique', true, 'nome', "nome != ''")
    app.save(col)
  },
)

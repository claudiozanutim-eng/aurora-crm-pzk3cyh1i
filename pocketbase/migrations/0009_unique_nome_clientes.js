migrate(
  (app) => {
    // Remove duplicates before creating the unique index
    app
      .db()
      .newQuery(`
      DELETE FROM clientes WHERE id NOT IN (
        SELECT MIN(id) FROM clientes GROUP BY nome
      ) AND nome IS NOT NULL AND nome != ''
    `)
      .execute()

    const col = app.findCollectionByNameOrId('clientes')

    try {
      col.removeIndex('idx_clientes_nome')
    } catch (e) {}

    col.addIndex('idx_clientes_nome_unique', true, 'nome', "nome != ''")

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    try {
      col.removeIndex('idx_clientes_nome_unique')
    } catch (e) {}

    col.addIndex('idx_clientes_nome', false, 'nome', '')

    app.save(col)
  },
)

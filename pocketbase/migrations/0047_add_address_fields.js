migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    if (!col.fields.getByName('pais')) {
      col.fields.add(new TextField({ name: 'pais' }))
    }
    if (!col.fields.getByName('cep')) {
      col.fields.add(new TextField({ name: 'cep' }))
    }
    if (!col.fields.getByName('rua')) {
      col.fields.add(new TextField({ name: 'rua' }))
    }
    if (!col.fields.getByName('numero')) {
      col.fields.add(new TextField({ name: 'numero' }))
    }
    if (!col.fields.getByName('complemento')) {
      col.fields.add(new TextField({ name: 'complemento' }))
    }
    if (!col.fields.getByName('bairro')) {
      col.fields.add(new TextField({ name: 'bairro' }))
    }
    if (!col.fields.getByName('cidade')) {
      col.fields.add(new TextField({ name: 'cidade' }))
    }
    if (!col.fields.getByName('estado')) {
      col.fields.add(new TextField({ name: 'estado' }))
    }

    app.save(col)

    app
      .db()
      .newQuery("UPDATE clientes SET pais = 'Brasil' WHERE pais IS NULL OR pais = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.fields.removeByName('pais')
    col.fields.removeByName('cep')
    col.fields.removeByName('rua')
    col.fields.removeByName('numero')
    col.fields.removeByName('complemento')
    col.fields.removeByName('bairro')
    col.fields.removeByName('cidade')
    col.fields.removeByName('estado')
    app.save(col)
  },
)

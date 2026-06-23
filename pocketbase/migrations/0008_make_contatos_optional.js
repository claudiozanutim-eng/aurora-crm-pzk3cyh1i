migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    const nome = col.fields.getByName('nome')
    if (nome) nome.required = false

    const email = col.fields.getByName('email')
    if (email) email.required = false

    const telefone = col.fields.getByName('telefone')
    if (telefone) telefone.required = false

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    const nome = col.fields.getByName('nome')
    if (nome) nome.required = true

    const email = col.fields.getByName('email')
    if (email) email.required = true

    const telefone = col.fields.getByName('telefone')
    if (telefone) telefone.required = true

    app.save(col)
  },
)

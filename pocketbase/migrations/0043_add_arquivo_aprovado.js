migrate(
  (app) => {
    const propostas = app.findCollectionByNameOrId('propostas')
    propostas.fields.add(
      new FileField({
        name: 'arquivo_aprovado',
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      }),
    )
    app.save(propostas)

    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tipoField = interacoes.fields.getByName('tipo')
    if (!tipoField.values.includes('Proposta Aprovada')) {
      tipoField.values.push('Proposta Aprovada')
    }
    app.save(interacoes)
  },
  (app) => {
    const propostas = app.findCollectionByNameOrId('propostas')
    propostas.fields.removeByName('arquivo_aprovado')
    app.save(propostas)

    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tipoField = interacoes.fields.getByName('tipo')
    tipoField.values = tipoField.values.filter((v) => v !== 'Proposta Aprovada')
    app.save(interacoes)
  },
)

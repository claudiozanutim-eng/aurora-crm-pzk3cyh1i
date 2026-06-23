migrate(
  (app) => {
    const tarefas = app.findCollectionByNameOrId('tarefas')
    tarefas.fields.add(
      new SelectField({
        name: 'tipo',
        required: false,
        values: [
          'E-mail',
          'WhatsApp',
          'Telefonema',
          'Reunião',
          'Proposta Enviada',
          'Enviar Proposta',
        ],
        maxSelect: 1,
      }),
    )
    app.save(tarefas)

    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tipoField = interacoes.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = [
        'E-mail',
        'WhatsApp',
        'Telefonema',
        'Reunião',
        'Proposta Enviada',
        'Enviar Proposta',
      ]
      app.save(interacoes)
    }
  },
  (app) => {
    const tarefas = app.findCollectionByNameOrId('tarefas')
    tarefas.fields.removeByName('tipo')
    app.save(tarefas)

    const interacoes = app.findCollectionByNameOrId('interacoes')
    const tipoField = interacoes.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['E-mail', 'WhatsApp', 'Telefonema', 'Reunião', 'Proposta Enviada']
      app.save(interacoes)
    }
  },
)

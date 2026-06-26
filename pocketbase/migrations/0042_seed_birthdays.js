migrate(
  (app) => {
    const contatos = app.findCollectionByNameOrId('contatos')
    const emails = ['maria@futuroeduc.com.br', 'carlos@totalshop.com.br']
    const years = [1989, 1982]

    const now = new Date()
    const month = ('0' + (now.getMonth() + 1)).slice(-2)
    const day = ('0' + now.getDate()).slice(-2)

    for (let i = 0; i < emails.length; i++) {
      try {
        const record = app.findFirstRecordByData('contatos', 'email', emails[i])
        const bdayStr = years[i] + '-' + month + '-' + day + ' 12:00:00.000Z'
        record.set('data_aniversario', bdayStr)
        app.save(record)
      } catch (_) {
        // Ignore if seed contact is missing
      }
    }
  },
  (app) => {
    const emails = ['maria@futuroeduc.com.br', 'carlos@totalshop.com.br']
    for (let i = 0; i < emails.length; i++) {
      try {
        const record = app.findFirstRecordByData('contatos', 'email', emails[i])
        record.set('data_aniversario', null)
        app.save(record)
      } catch (_) {}
    }
  },
)

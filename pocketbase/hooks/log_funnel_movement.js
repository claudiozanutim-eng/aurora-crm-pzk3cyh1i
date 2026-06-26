onRecordAfterUpdateSuccess(
  (e) => {
    const oldStatus = e.record.original().getString('status')
    const newStatus = e.record.getString('status')

    if (oldStatus && newStatus && oldStatus !== newStatus) {
      const user = e.auth
      const userName = user ? user.getString('name') || user.getString('email') : 'Sistema'
      const userId = user ? user.id : ''

      if (userId) {
        const date = new Date()
        const d = String(date.getDate()).padStart(2, '0')
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const y = date.getFullYear()
        const hh = String(date.getHours()).padStart(2, '0')
        const mm = String(date.getMinutes()).padStart(2, '0')
        const formattedDate = `${d}/${m}/${y} às ${hh}:${mm}`

        const resumo = `Card movido de ${oldStatus} para ${newStatus} por ${userName} em ${formattedDate}`

        try {
          const col = $app.findCollectionByNameOrId('interacoes')
          const interacao = new Record(col)

          if (e.collection.name === 'negocios') {
            interacao.set('cliente_id', e.record.getString('cliente_id'))
          } else if (e.collection.name === 'leads') {
            interacao.set('lead_id', e.record.id)
          }

          interacao.set('tipo', 'Movimentação de Funil')
          interacao.set('data_hora', date.toISOString())
          interacao.set('vendedor_id', userId)
          interacao.set('resumo', resumo)

          $app.save(interacao)
        } catch (err) {
          $app
            .logger()
            .error('Error logging funnel movement', 'error', err.message, 'recordId', e.record.id)
        }
      }
    }

    e.next()
  },
  'negocios',
  'leads',
)

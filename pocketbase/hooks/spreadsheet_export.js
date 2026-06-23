// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/spreadsheet/export',
  (e) => {
    const { utils, write } = require('xlsx')
    const body = e.requestInfo().body

    if (!body.data || !Array.isArray(body.data)) {
      return e.badRequestError('missing data array')
    }

    try {
      const ws = utils.aoa_to_sheet(body.data)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Clientes')
      const base64 = write(wb, { type: 'base64', bookType: 'xlsx' })

      return e.json(200, { base64 })
    } catch (err) {
      return e.badRequestError('Exportação falhou: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/spreadsheet/export',
  (e) => {
    const body = e.requestInfo().body

    if (!body.data || !Array.isArray(body.data)) {
      return e.badRequestError('missing data array')
    }

    try {
      const XLSX = require('xlsx')

      const ws = XLSX.utils.aoa_to_sheet(body.data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Planilha1')

      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

      return e.json(200, { base64 })
    } catch (err) {
      return e.badRequestError('Exportação falhou: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

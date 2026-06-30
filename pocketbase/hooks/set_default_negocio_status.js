onRecordCreateRequest((e) => {
  const status = e.record.getString('status')
  if (!status || status === 'Prospecção') {
    e.record.set('status', 'Prospect')
  }
  e.next()
}, 'negocios')

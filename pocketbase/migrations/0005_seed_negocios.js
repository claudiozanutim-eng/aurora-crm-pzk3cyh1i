migrate(
  (app) => {
    const negocios = app.findCollectionByNameOrId('negocios')

    const clienteRecords = app.findRecordsByFilter('clientes', '1=1', '', 10, 0)
    if (clienteRecords.length === 0) return

    const getCliente = (idx) => clienteRecords[idx % clienteRecords.length]

    const seeds = [
      {
        cliente: getCliente(0),
        valor: 15000,
        prob: 20,
        status: 'Prospecção',
        prio: 'Média',
        desc: 'Primeiro contato realizado para prospecção inicial.',
      },
      {
        cliente: getCliente(1),
        valor: 45000,
        prob: 50,
        status: 'Qualificação',
        prio: 'Alta',
        desc: 'Cliente demonstrou interesse na solução, agendando demo.',
      },
      {
        cliente: getCliente(2),
        valor: 8000,
        prob: 70,
        status: 'Proposta Enviada',
        prio: 'Baixa',
        desc: 'Aguardando retorno da proposta comercial enviada por email.',
      },
      {
        cliente: getCliente(3),
        valor: 120000,
        prob: 90,
        status: 'Negociação',
        prio: 'Alta',
        desc: 'Ajustando detalhes contratuais e prazos de pagamento.',
      },
      {
        cliente: getCliente(4),
        valor: 5000,
        prob: 10,
        status: 'Perdido',
        prio: 'Média',
        desc: 'Optou pela concorrência devido a restrição de budget.',
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('negocios', 'descricao', s.desc)
        continue
      } catch (_) {}

      const record = new Record(negocios)
      record.set('cliente_id', s.cliente.id)
      record.set('valor_estimado', s.valor)
      record.set('probabilidade', s.prob)
      record.set('status', s.status)
      record.set('prioridade', s.prio)
      record.set('descricao', s.desc)

      const d = new Date()
      d.setDate(d.getDate() + 30)
      record.set('data_prevista_fechamento', d.toISOString().replace('T', ' '))

      app.save(record)
    }
  },
  (app) => {
    // Can be left empty as data drops are usually handled manually or cascaded
  },
)

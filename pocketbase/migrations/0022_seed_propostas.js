migrate(
  (app) => {
    const propostas = app.findCollectionByNameOrId('propostas')
    const clientes = app.findRecordsByFilter('clientes', '1=1', '', 10, 0)
    const negocios = app.findRecordsByFilter('negocios', '1=1', '', 10, 0)

    if (clientes.length === 0) return

    const c1 = clientes[0]
    const c2 = clientes.length > 1 ? clientes[1] : clientes[0]
    const c3 = clientes.length > 2 ? clientes[2] : clientes[0]

    const n1 = negocios.find((n) => n.getString('cliente_id') === c1.id)
    const n2 = negocios.find((n) => n.getString('cliente_id') === c2.id)
    const n3 = negocios.find((n) => n.getString('cliente_id') === c3.id)

    const seeds = [
      {
        titulo: 'Proposta de Consultoria Comercial',
        cliente_id: c1.id,
        negocio_id: n1 ? n1.id : null,
        valor_total: 12500,
        descricao_servicos:
          'Consultoria especializada em reestruturação do funil de vendas, definição de processos comerciais e treinamento da equipe de linha de frente.\n\nEscopo do trabalho:\n- Diagnóstico atual\n- Mapeamento de processos\n- Implementação de novo fluxo no CRM\n- 16h de treinamento in-company',
        condicoes_comerciais:
          'Condições de Pagamento:\n- 30% no aceite\n- 40% na entrega do mapeamento\n- 30% após o treinamento\n\nPrazo de execução estimado: 45 dias.',
        validade_dias: 15,
        status: 'Rascunho',
      },
      {
        titulo: 'Licenciamento Plataforma EAD',
        cliente_id: c2.id,
        negocio_id: n2 ? n2.id : null,
        valor_total: 45000,
        descricao_servicos:
          'Licenciamento anual da plataforma EAD com capacidade para até 5.000 alunos simultâneos. Inclui personalização de layout (white-label) e integração com sistema acadêmico atual.',
        condicoes_comerciais:
          'Pagamento em 12 parcelas iguais e consecutivas, vencimento dia 10 de cada mês.\nReajuste anual pelo IGPM.\nSuporte técnico nível 2 incluso (SLA 8 horas).',
        validade_dias: 30,
        status: 'Enviada',
        data_envio: new Date().toISOString().replace('T', ' '),
      },
      {
        titulo: 'Programa de Mentoria Executiva',
        cliente_id: c3.id,
        negocio_id: n3 ? n3.id : null,
        valor_total: 18000,
        descricao_servicos:
          'Mentoria 1:1 para diretores de nível C (C-level). Total de 10 encontros de 2 horas cada, focados em liderança adaptativa e gestão de mudanças.',
        condicoes_comerciais:
          'Pagamento à vista com 10% de desconto ou em 3x sem juros no cartão de crédito corporativo.',
        validade_dias: 10,
        status: 'Aprovada',
        data_envio: new Date(Date.now() - 5 * 86400000).toISOString().replace('T', ' '),
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('propostas', 'titulo', s.titulo)
        continue
      } catch (_) {}

      const record = new Record(propostas)
      record.set('titulo', s.titulo)
      record.set('cliente_id', s.cliente_id)
      if (s.negocio_id) record.set('negocio_id', s.negocio_id)
      record.set('valor_total', s.valor_total)
      record.set('descricao_servicos', s.descricao_servicos)
      record.set('condicoes_comerciais', s.condicoes_comerciais)
      record.set('validade_dias', s.validade_dias)
      record.set('status', s.status)
      if (s.data_envio) record.set('data_envio', s.data_envio)
      app.save(record)
    }
  },
  (app) => {
    try {
      const propostas = app.findCollectionByNameOrId('propostas')
      app.truncateCollection(propostas)
    } catch (_) {}
  },
)

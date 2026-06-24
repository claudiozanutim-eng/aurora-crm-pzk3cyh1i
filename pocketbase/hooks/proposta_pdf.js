routerAdd(
  'GET',
  '/backend/v1/propostas/{id}/pdf',
  (e) => {
    if (!e.auth?.id) {
      return e.unauthorizedError('Autenticação necessária.')
    }

    const id = e.request.pathValue('id')

    let proposta
    try {
      proposta = $app.findRecordById('propostas', id)
    } catch (err) {
      return e.notFoundError('Proposta não encontrada.')
    }

    let cliente = null
    const clienteId = proposta.getString('cliente_id')
    if (clienteId) {
      try {
        cliente = $app.findRecordById('clientes', clienteId)
      } catch (err) {}
    }

    let negocio = null
    const negocioId = proposta.getString('negocio_id')
    if (negocioId) {
      try {
        negocio = $app.findRecordById('negocios', negocioId)
      } catch (err) {}
    }

    const createdStr = proposta.getString('created')
    const d = new Date(createdStr)
    const dateStr =
      ('0' + d.getDate()).slice(-2) +
      '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      '/' +
      d.getFullYear()

    const clientName = cliente ? cliente.getString('nome') : 'Cliente não informado'
    let clienteDoc = ''
    if (cliente && cliente.getString('documento')) {
      const tipo = cliente.getString('tipo') === 'PJ' ? 'CNPJ: ' : 'CPF: '
      clienteDoc = tipo + cliente.getString('documento')
    }

    let negocioDesc = ''
    if (negocio && negocio.getString('descricao')) {
      negocioDesc = negocio.getString('descricao')
    }

    const valorTotal = proposta.getFloat('valor_total')
    const formattedValor =
      'R$ ' +
      valorTotal
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Proposta ${proposta.id.substring(0, 8).toUpperCase()}</title>
  <style>
    :root {
      --orange: #f97316;
      --light-orange: #fdba74;
      --gray: #666666;
      --black: #000000;
    }
    body { 
      font-family: Helvetica, Arial, sans-serif; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background: #f4f4f5;
    }
    .page { 
      max-width: 210mm;
      min-height: 297mm;
      margin: 20px auto; 
      padding: 50px; 
      background: #fff;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 40px;
    }
    .header-left h1 { 
      color: var(--orange);
      font-size: 32px; 
      margin: 0;
    }
    .header-right { 
      text-align: right; 
      color: var(--gray); 
      font-size: 14px; 
      line-height: 1.5;
    }
    .divider {
      height: 1px;
      background-color: var(--orange);
      margin-bottom: 30px;
    }
    .prep-para { 
      color: var(--orange); 
      font-size: 12px; 
      font-weight: bold; 
      text-transform: uppercase; 
      margin-bottom: 5px; 
    }
    .cliente-nome { 
      font-size: 20px; 
      font-weight: bold; 
      color: var(--black); 
      margin: 0 0 5px 0; 
    }
    .cliente-doc { 
      color: var(--gray); 
      font-size: 14px; 
      margin: 0 0 5px 0; 
    }
    .titulo { 
      font-size: 28px; 
      font-weight: bold; 
      color: var(--orange); 
      margin: 50px 0 30px 0; 
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title { 
      font-size: 18px; 
      font-weight: bold; 
      color: var(--orange); 
      margin: 0 0 10px 0; 
    }
    .section-divider {
      height: 1px;
      background-color: var(--light-orange);
      width: 250px;
      margin-bottom: 20px;
    }
    .content { 
      font-size: 15px; 
      line-height: 1.6; 
      white-space: pre-wrap; 
      color: var(--black);
    }
    .valor { 
      font-size: 24px; 
      font-weight: bold; 
      color: var(--black); 
      margin: 10px 0; 
    }
    .footer { 
      margin-top: 80px; 
      border-top: 1px solid var(--orange); 
      padding-top: 20px; 
      text-align: center; 
      color: var(--gray); 
      font-size: 14px; 
    }
    
    @media print {
      body { 
        background: #fff;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
      }
      .page { 
        margin: 0;
        padding: 20px;
        box-shadow: none;
        width: 100%;
        max-width: 100%;
      }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>IC Educ</h1>
      </div>
      <div class="header-right">
        <div>contato@iceduc.com.br</div>
        <div>Data de emissão: ${dateStr}</div>
        <div>Ref: #${proposta.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="prep-para">PREPARADO PARA</div>
    <div class="cliente-nome">${clientName}</div>
    ${clienteDoc ? `<div class="cliente-doc">${clienteDoc}</div>` : ''}
    ${negocioDesc ? `<div class="cliente-doc">Negócio: ${negocioDesc}</div>` : ''}
    
    <div class="titulo">${proposta.getString('titulo')}</div>
    
    <div class="section">
      <div class="section-title">Escopo e Descrição dos Serviços</div>
      <div class="section-divider"></div>
      <div class="content">${proposta.getString('descricao_servicos')}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Investimento</div>
      <div class="section-divider"></div>
      <div class="valor">${formattedValor}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Condições Comerciais</div>
      <div class="section-divider"></div>
      <div class="content">${proposta.getString('condicoes_comerciais')}</div>
    </div>
    
    <div class="footer">
      <div>Validade desta proposta: ${proposta.getInt('validade_dias')} dias a partir da data de envio.</div>
      <div style="margin-top: 5px;">Agradecemos a oportunidade de apresentar esta proposta comercial.</div>
    </div>
  </div>
  <script>
    window.onload = () => { 
      setTimeout(() => { window.print(); }, 500);
    }
  </script>
</body>
</html>`

    return e.html(200, html)
  },
  $apis.requireAuth(),
)

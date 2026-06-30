routerAdd(
  'POST',
  '/backend/v1/purge-data',
  (e) => {
    var body = e.requestInfo().body || {}
    var collection = body.collection || ''
    var password = body.password || ''
    var statusFilter = body.status || null
    var dataInicio = body.data_inicio || ''
    var dataFim = body.data_fim || ''

    var allowed = ['clientes', 'contatos', 'leads']
    if (allowed.indexOf(collection) === -1) return e.badRequestError('Coleção inválida para purga')
    if (!e.auth) return e.unauthorizedError('Autenticação necessária')
    if (e.auth.getString('perfil') !== 'Admin')
      return e.forbiddenError('Apenas administradores podem executar esta ação')
    if (!password) return e.badRequestError('Senha é obrigatória')
    if (!e.auth.validatePassword(password)) return e.json(401, { error: 'Senha incorreta' })

    // === Pre-deletion backup (safety transactional logic) ===
    try {
      var _bkFields = {
        clientes: [
          'id',
          'tipo',
          'documento',
          'nome',
          'nome_fantasia',
          'segmento',
          'porte',
          'data_cadastro',
          'created',
          'updated',
          'data_conversao',
          'observacoes',
          'tags',
          'status',
          'pais',
          'cep',
          'rua',
          'numero',
          'complemento',
          'bairro',
          'cidade',
          'estado',
        ],
        contatos: [
          'id',
          'cliente_id',
          'nome',
          'email',
          'telefone',
          'cargo',
          'data_aniversario',
          'is_principal',
          'created',
          'updated',
          'telefone_fixo',
        ],
        negocios: [
          'id',
          'cliente_id',
          'valor_estimado',
          'probabilidade',
          'data_prevista_fechamento',
          'data_fechamento_real',
          'status',
          'prioridade',
          'descricao',
          'ciclo_vendas_dias',
          'created',
          'updated',
          'probabilidade_nivel',
          'motivo_perda',
          'vendedor_id',
        ],
        leads: [
          'id',
          'nome',
          'contato_nome',
          'telefone',
          'email',
          'tipo',
          'origem',
          'segmento',
          'prioridade',
          'status',
          'vendedor_id',
          'created',
          'updated',
          'observacoes',
          'tags',
          'cliente_id',
        ],
        interacoes: [
          'id',
          'cliente_id',
          'lead_id',
          'tipo',
          'data_hora',
          'vendedor_id',
          'resumo',
          'created',
          'updated',
          'observacoes',
        ],
        tarefas: [
          'id',
          'cliente_id',
          'lead_id',
          'vendedor_id',
          'descricao',
          'data_limite',
          'prioridade',
          'status',
          'created',
          'updated',
          'tipo',
        ],
        propostas: [
          'id',
          'titulo',
          'cliente_id',
          'negocio_id',
          'valor_total',
          'descricao_servicos',
          'condicoes_comerciais',
          'validade_dias',
          'status',
          'data_envio',
          'created',
          'updated',
          'validade_ate',
          'arquivo_aprovado',
        ],
      }
      var _bkTables = [
        'clientes',
        'contatos',
        'negocios',
        'leads',
        'interacoes',
        'tarefas',
        'propostas',
      ]
      var _snap = {
        _meta: {
          generatedAt: new Date().toISOString(),
          reason: 'Pre-deletion backup',
          collection: collection,
        },
      }
      for (var _bi = 0; _bi < _bkTables.length; _bi++) {
        var _bt = _bkTables[_bi]
        try {
          var _brs = $app.findRecordsByFilter(_bt, "id != ''", '', 100000, 0)
          var _ba = []
          for (var _bj = 0; _bj < _brs.length; _bj++) {
            var _bd = {}
            var _bf = _bkFields[_bt]
            for (var _bk = 0; _bk < _bf.length; _bk++) {
              _bd[_bf[_bk]] = _brs[_bj].get(_bf[_bk])
            }
            _ba.push(_bd)
          }
          _snap[_bt] = _ba
        } catch (_berr) {
          _snap[_bt] = []
        }
      }
      var _json = JSON.stringify(_snap)
      var _utf8 = unescape(encodeURIComponent(_json))
      var _bytes = []
      for (var _si = 0; _si < _utf8.length; _si++) {
        _bytes.push(_utf8.charCodeAt(_si))
      }
      var _sizeNum = _bytes.length
      var _sizeStr =
        _sizeNum < 1024
          ? _sizeNum + ' B'
          : _sizeNum < 1048576
            ? (_sizeNum / 1024).toFixed(1) + ' KB'
            : (_sizeNum / 1048576).toFixed(1) + ' MB'
      var _fname = 'backup_auto_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'
      var _file = $filesystem.fileFromBytes(_bytes, _fname)
      var _bkCol = $app.findCollectionByNameOrId('backups')
      var _bkRec = new Record(_bkCol)
      _bkRec.set('arquivo', _file)
      _bkRec.set('tipo', 'Automático - Exclusão')
      _bkRec.set('usuario_id', e.auth.id)
      _bkRec.set('tamanho', _sizeStr)
      $app.save(_bkRec)
      try {
        var _auCol = $app.findCollectionByNameOrId('auditoria')
        var _auRec = new Record(_auCol)
        _auRec.set('usuario_id', e.auth.id)
        _auRec.set('acao', 'Backup Automático Pré-Exclusão')
        _auRec.set('recurso', 'backups')
        _auRec.set(
          'detalhes',
          'Backup gerado antes da exclusão de ' + collection + ' | Tamanho: ' + _sizeStr,
        )
        $app.save(_auRec)
      } catch (_ae) {}
    } catch (_bkErr) {
      return e.json(500, {
        error: 'Erro ao gerar backup de segurança. A exclusão foi cancelada por segurança.',
      })
    }

    function buildWhere(col) {
      var conditions = [],
        params = {}
      if (
        statusFilter &&
        Array.isArray(statusFilter) &&
        statusFilter.length > 0 &&
        (col === 'clientes' || col === 'leads')
      ) {
        var ph = statusFilter
          .map(function (s, i) {
            return '{:st' + i + '}'
          })
          .join(',')
        conditions.push('status IN (' + ph + ')')
        statusFilter.forEach(function (s, i) {
          params['st' + i] = s
        })
      }
      if (dataInicio) {
        conditions.push('created >= {:di}')
        params.di = dataInicio + ' 00:00:00'
      }
      if (dataFim) {
        conditions.push('created <= {:df}')
        params.df = dataFim + ' 23:59:59'
      }
      return {
        where: conditions.length ? ' WHERE ' + conditions.join(' AND ') : '',
        params: params,
      }
    }

    function execQuery(sql, params) {
      var q = $app.db().newQuery(sql)
      if (params && Object.keys(params).length > 0) q.bind(params)
      q.execute()
    }

    try {
      var f = buildWhere(collection)
      var countModel = new DynamicModel({ cnt: 0 })
      var cq = $app.db().newQuery('SELECT COUNT(*) as cnt FROM ' + collection + f.where)
      if (Object.keys(f.params).length > 0) cq.bind(f.params)
      cq.one(countModel)
      var deletedCount = countModel.cnt

      if (collection === 'clientes') {
        var sw = buildWhere('clientes')
        var tables = ['negocios', 'contatos', 'interacoes', 'propostas', 'tarefas']
        for (var i = 0; i < tables.length; i++) {
          execQuery(
            'DELETE FROM ' +
              tables[i] +
              ' WHERE cliente_id IN (SELECT id FROM clientes' +
              sw.where +
              ')',
            sw.params,
          )
        }
      }

      if (collection === 'contatos' && !f.where) {
        execQuery('DELETE FROM interacoes WHERE cliente_id IN (SELECT id FROM clientes)', null)
      }

      if (collection === 'leads') {
        var slw = buildWhere('leads')
        execQuery(
          'DELETE FROM interacoes WHERE lead_id IN (SELECT id FROM leads' + slw.where + ')',
          slw.params,
        )
        execQuery(
          'DELETE FROM tarefas WHERE lead_id IN (SELECT id FROM leads' + slw.where + ')',
          slw.params,
        )
      }

      execQuery('DELETE FROM ' + collection + f.where, f.params)

      try {
        var auditCol = $app.findCollectionByNameOrId('auditoria')
        var auditRecord = new Record(auditCol)
        auditRecord.set('usuario_id', e.auth.id)
        auditRecord.set(
          'acao',
          'Exclusão de ' + collection.charAt(0).toUpperCase() + collection.slice(1),
        )
        auditRecord.set('recurso', collection)
        var detalhes = deletedCount + ' registro(s) excluído(s)'
        if (
          statusFilter &&
          Array.isArray(statusFilter) &&
          statusFilter.length > 0 &&
          (collection === 'clientes' || collection === 'leads')
        ) {
          detalhes += ' | Status: ' + statusFilter.join(', ')
        }
        if (dataInicio || dataFim)
          detalhes += ' | Período: ' + (dataInicio || 'início') + ' a ' + (dataFim || 'fim')
        auditRecord.set('detalhes', detalhes)
        $app.save(auditRecord)
      } catch (ae) {}

      return e.json(200, {
        success: true,
        count: deletedCount,
        message: deletedCount + ' registro(s) de ' + collection + ' foram removidos',
      })
    } catch (err) {
      return e.internalServerError('Erro ao purgar dados: ' + err.message)
    }
  },
  $apis.requireAuth(),
)

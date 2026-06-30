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

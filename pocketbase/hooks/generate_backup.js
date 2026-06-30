routerAdd(
  'POST',
  '/backend/v1/generate-backup',
  (e) => {
    try {
      var userId = e.auth ? e.auth.id : ''
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      if (e.auth.getString('perfil') !== 'Admin')
        return e.forbiddenError('Apenas administradores podem gerar backups')

      var TABLE_FIELDS = {
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

      var snapTables = [
        'clientes',
        'contatos',
        'negocios',
        'leads',
        'interacoes',
        'tarefas',
        'propostas',
      ]
      var snapshot = {
        _meta: {
          generatedAt: new Date().toISOString(),
          reason: 'Manual backup',
          generatedBy: e.auth.getString('name') || e.auth.getString('email') || 'Admin',
        },
      }

      for (var i = 0; i < snapTables.length; i++) {
        var tName = snapTables[i]
        try {
          var records = $app.findRecordsByFilter(tName, "id != ''", '', 100000, 0)
          var arr = []
          for (var j = 0; j < records.length; j++) {
            var data = {}
            var fields = TABLE_FIELDS[tName]
            for (var k = 0; k < fields.length; k++) {
              data[fields[k]] = records[j].get(fields[k])
            }
            arr.push(data)
          }
          snapshot[tName] = arr
        } catch (err) {
          snapshot[tName] = []
        }
      }

      var jsonStr = JSON.stringify(snapshot)
      var utf8 = unescape(encodeURIComponent(jsonStr))
      var bytes = []
      for (var si = 0; si < utf8.length; si++) {
        bytes.push(utf8.charCodeAt(si))
      }
      var sizeNum = bytes.length
      var sizeStr =
        sizeNum < 1024
          ? sizeNum + ' B'
          : sizeNum < 1048576
            ? (sizeNum / 1024).toFixed(1) + ' KB'
            : (sizeNum / 1048576).toFixed(1) + ' MB'

      var fileName = 'backup_manual_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'
      var fileObj = $filesystem.fileFromBytes(bytes, fileName)

      var backupCol = $app.findCollectionByNameOrId('backups')
      var backupRecord = new Record(backupCol)
      backupRecord.set('arquivo', fileObj)
      backupRecord.set('tipo', 'Manual')
      backupRecord.set('usuario_id', userId)
      backupRecord.set('tamanho', sizeStr)
      $app.save(backupRecord)

      try {
        var auditCol = $app.findCollectionByNameOrId('auditoria')
        var auditRecord = new Record(auditCol)
        auditRecord.set('usuario_id', userId)
        auditRecord.set('acao', 'Backup Manual')
        auditRecord.set('recurso', 'backups')
        auditRecord.set('detalhes', 'Backup manual gerado | Tamanho: ' + sizeStr)
        $app.save(auditRecord)
      } catch (ae) {}

      return e.json(200, {
        id: backupRecord.id,
        tipo: 'Manual',
        tamanho: sizeStr,
        created: backupRecord.get('created'),
        message: 'Backup gerado com sucesso!',
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao gerar backup: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

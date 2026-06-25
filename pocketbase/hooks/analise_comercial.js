routerAdd(
  'POST',
  '/backend/v1/analise-comercial',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')
      if (!body.cliente_id) return e.badRequestError('cliente_id is required')

      const message = `Por favor, faça a análise comercial estruturada para o cliente com ID: ${body.cliente_id}.`

      const conv = $ai.agent('analista-comercial').getOrCreateConversation({
        user_id: userId,
        id: null,
        title: `Análise Cliente ${body.cliente_id}`,
      })

      const iter = $ai.agent('analista-comercial').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
    } catch (err) {
      if (err.name === 'SkipAiConfigError')
        return e.json(503, { error: 'AI temporarily unavailable' })
      if (err.name === 'SkipAiAgentsError') {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'agent request failed' : err.message })
      }
      if (err.name === 'SkipAiError') {
        const status = err.status || 502
        return e.json(status, { error: status >= 500 ? 'AI temporarily unavailable' : err.message })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

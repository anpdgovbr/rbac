import test from 'node:test'
import assert from 'node:assert/strict'
import { withApi } from '../src/index.js'

test('withApi denies when permission missing', async () => {
  const handler = async () => new Response('ok')
  const provider = { getPermissionsByIdentity: async () => ({}), invalidate() {} }
  const getIdentity = { resolve: async () => ({ id: '1', email: 'a@x' }) }
  const GET = withApi(handler, { provider: provider as any, getIdentity: getIdentity as any, permissao: { acao: 'Exibir', recurso: 'Permissoes' } })
  const res = await GET(new Request('http://local'))
  assert.equal(res.status, 403)
})


import test from 'node:test'
import assert from 'node:assert/strict'
import { createPrismaPermissionsProvider } from '../src/index.js'

test('createPrismaPermissionsProvider aggregates permissions with grant precedence', async () => {
  const prisma = {
    usuario: {
      findUnique: async ({ where }: any) => ({ email: where.email, perfil: { nome: 'Admin', active: true } })
    },
    perfil: {
      findUnique: async () => ({ id: 1, nome: 'Admin', active: true, heranca: { herdaDo: { nome: 'Leitor', active: true } } })
    },
    permissao: {
      findMany: async () => ([
        { acao: 'Exibir', recurso: 'Permissoes', permitido: false },
        { acao: 'Exibir', recurso: 'Permissoes', permitido: true },
      ])
    }
  }
  const provider = createPrismaPermissionsProvider({ prisma: prisma as any })
  const perms = await provider.getPermissionsByIdentity('x@y')
  assert.equal(perms.Exibir?.Permissoes, true)
})


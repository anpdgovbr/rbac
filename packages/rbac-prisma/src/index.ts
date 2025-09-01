import type { PermissionsMap, Action, Resource } from '@anpdgovbr/rbac-core'
import { toPermissionsMap } from '@anpdgovbr/rbac-core'
import type { PermissionsProvider } from '@anpdgovbr/rbac-provider'

/** Prisma-like client para injeção (PrismaClient). */
export type PrismaLike = {
  [key: string]: any
}

export type PrismaRbacOptions = {
  prisma: PrismaLike
  tables?: {
    perfil?: string
    permissao?: string
    perfilHeranca?: string
    user?: string
  }
  // identity refere-se ao email por padrão
  identityField?: 'email' | 'id'
}

const defaultTables = {
  perfil: 'perfil',
  permissao: 'permissao',
  perfilHeranca: 'perfilHeranca',
  user: 'user',
}

/** Resolve a herança de perfis (DAG), retornando nomes de perfis válidos. */
export async function getPerfisHerdadosNomes(prisma: PrismaLike, perfilNome: string, tables = defaultTables): Promise<string[]> {
  const Perfil = prisma[tables.perfil]
  const PerfilHeranca = prisma[tables.perfilHeranca]
  const base = await Perfil.findUnique({
    where: { nome: perfilNome },
    select: { id: true, nome: true, active: true },
  })
  if (!base?.active) return []

  const resultNames = new Set<string>([base.nome])
  const visited = new Set<number>([base.id])
  let frontier: number[] = [base.id]

  while (frontier.length) {
    const edges = await PerfilHeranca.findMany({
      where: { childId: { in: frontier } },
      select: {
        parentId: true,
        parent: { select: { id: true, nome: true, active: true } },
      },
    })
    frontier = []
    for (const e of edges) {
      if (!e.parent.active) continue
      if (visited.has(e.parentId)) continue
      visited.add(e.parentId)
      resultNames.add(e.parent.nome)
      frontier.push(e.parentId)
    }
  }
  return Array.from(resultNames)
}

/** Obtém as permissões efetivas de um perfil considerando herança e união por grant verdadeiro. */
export async function getPermissoesPorPerfil(prisma: PrismaLike, perfilNome: string, tables = defaultTables): Promise<Array<{ acao: Action; recurso: Resource; permitido: boolean }>> {
  const perfisHerdados = await getPerfisHerdadosNomes(prisma, perfilNome, tables)
  const Permissao = prisma[tables.permissao]
  const permissoes = await Permissao.findMany({
    where: {
      perfil: {
        nome: { in: perfisHerdados },
        active: true,
      },
    },
    select: {
      acao: true,
      recurso: true,
      permitido: true,
    },
  })

  const permissoesMap = new Map<string, { acao: Action; recurso: Resource; permitido: boolean }>()
  for (const p of permissoes) {
    const key = `${p.acao}_${p.recurso}`
    if (!permissoesMap.has(key) || p.permitido) {
      permissoesMap.set(key, { acao: p.acao, recurso: p.recurso, permitido: p.permitido })
    }
  }
  return Array.from(permissoesMap.values())
}

/** Cria um PermissionsProvider baseado em Prisma (identity por email ou id). */
export function createPrismaPermissionsProvider(opts: PrismaRbacOptions): PermissionsProvider {
  const { prisma, tables: partialTables, identityField = 'email' } = opts
  const tables = { ...defaultTables, ...partialTables }
  const User = prisma[tables.user]
  const Perfil = prisma[tables.perfil]
  return {
    async getPermissionsByIdentity(identity: string): Promise<PermissionsMap> {
      // identity é email por padrão
      const where = identityField === 'email' ? { email: identity } : { id: identity }
      const usuario = await User.findUnique({
        where,
        include: { perfil: true },
      })
      if (!usuario?.perfil?.active) return {}
      const list = await getPermissoesPorPerfil(prisma, usuario.perfil.nome, tables)
      return toPermissionsMap(list)
    },
    invalidate() {
      // Sem estado aqui: cache fica no decorator withTTLCache
    },
  }
}

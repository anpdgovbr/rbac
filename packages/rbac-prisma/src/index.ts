/**
 * @fileoverview Adapter Prisma para RBAC com hierarquia de perfis e resolução de permissões
 * @version 0.1.0-beta.3
 * @author ANPD/DDSS/CGTI
 * @license MIT
 *
 * Este módulo fornece:
 * - Provider RBAC integrado ao Prisma ORM
 * - Algoritmos de traversal de hierarquia de perfis (DAG)
 * - Resolução de permissões com união por grant verdadeiro
 * - Configuração flexível de schema e tabelas
 * - Performance otimizada com queries eficientes
 */

import type { PermissionsMap, Action, Resource } from "@anpdgovbr/rbac-core"
import { toPermissionsMap } from "@anpdgovbr/rbac-core"
import type { PermissionsProvider } from "@anpdgovbr/rbac-provider"

/**
 * Interface básica para operações Prisma necessárias.
 * Permite injeção de qualquer cliente Prisma sem dependência direta.
 */
export type PrismaExec = (args: unknown) => Promise<unknown>

/**
 * Interface para modelo Prisma com operações de leitura.
 * Todas as operações de RBAC são read-only para evitar conflitos com lógica de negócio.
 */
export type PrismaModel = {
  findUnique: PrismaExec
  findMany: PrismaExec
}

/**
 * Interface para cliente Prisma genérico.
 * Permite flexibilidade no schema sem depender de tipos específicos.
 */
export type PrismaLike = Record<string, PrismaModel | Record<string, unknown>>

/**
 * Opções de configuração para o provider Prisma RBAC.
 */
export type PrismaRbacOptions = {
  /**
   * Instância do cliente Prisma.
   * Deve ter modelos que implementem o schema RBAC.
   */
  prisma: PrismaLike

  /**
   * Mapeamento de nomes de tabelas customizados.
   * Permite adaptação a schemas existentes.
   *
   * @example
   * ```ts
   * // Schema personalizado
   * tables: {
   *   perfil: "Roles",
   *   permissao: "Permissions",
   *   perfilHeranca: "RoleHierarchy",
   *   user: "Users"
   * }
   * ```
   */
  tables?: {
    /** Nome da tabela de perfis/roles @default "perfil" */
    perfil?: string
    /** Nome da tabela de permissões @default "permissao" */
    permissao?: string
    /** Nome da tabela de hierarquia de perfis @default "perfilHeranca" */
    perfilHeranca?: string
    /** Nome da tabela de usuários @default "user" */
    user?: string
  }

  /**
   * Campo usado para identificar usuário na resolução de identidade.
   *
   * - "email": Usa campo email para buscar usuário (padrão)
   * - "id": Usa campo id para buscar usuário
   *
   * @default "email"
   */
  identityField?: "email" | "id"
}

/**
 * Configuração padrão de nomes de tabelas.
 * Segue convenções do schema RBAC da ANPD.
 */
const defaultTables = {
  perfil: "perfil",
  permissao: "permissao",
  perfilHeranca: "perfilHeranca",
  user: "user",
}

/**
 * Resolve a hierarquia de perfis herdados usando algoritmo de traversal BFS.
 *
 * **Algoritmo:**
 * 1. Inicia com perfil base (se ativo)
 * 2. Busca pais via tabela de herança
 * 3. Evita ciclos com set de visitados
 * 4. Retorna apenas perfis ativos
 *
 * **Complexidade:** O(V + E) onde V = perfis, E = relações de herança
 *
 * **Schema esperado:**
 * ```sql
 * Perfil: { id, nome, active }
 * PerfilHeranca: { parentId, childId, parent: Perfil }
 * ```
 *
 * @param prisma - Cliente Prisma
 * @param perfilNome - Nome do perfil base para resolver herança
 * @param tables - Configuração de nomes de tabelas
 * @returns Array de nomes de perfis herdados (incluindo o base)
 *
 * @example
 * ```ts
 * // Hierarquia: Admin -> Moderator -> User
 * const perfis = await getPerfisHerdadosNomes(prisma, "User")
 * // Retorna: ["User", "Moderator", "Admin"]
 *
 * // Perfil inativo é ignorado
 * const perfisInativos = await getPerfisHerdadosNomes(prisma, "InactiveRole")
 * // Retorna: []
 * ```
 */
export async function getPerfisHerdadosNomes(
  prisma: PrismaLike,
  perfilNome: string,
  tables = defaultTables
): Promise<string[]> {
  type PerfilBase = { id: number; nome: string; active: boolean }
  type Edge = { parentId: number; parent: PerfilBase }

  const Perfil = prisma[tables.perfil] as PrismaModel
  const PerfilHeranca = prisma[tables.perfilHeranca] as PrismaModel

  // 1. Busca perfil base
  const base = (await Perfil.findUnique({
    where: { nome: perfilNome },
    select: { id: true, nome: true, active: true },
  })) as PerfilBase | null

  // Perfil não existe ou inativo
  if (!base?.active) return []

  // 2. Inicialização para BFS
  const resultNames = new Set<string>([base.nome])
  const visited = new Set<number>([base.id])
  let frontier: number[] = [base.id]

  // 3. Traversal BFS da hierarquia
  while (frontier.length) {
    // Busca todas as relações de herança dos perfis atuais
    const edges = (await PerfilHeranca.findMany({
      where: { childId: { in: frontier } },
      select: {
        parentId: true,
        parent: { select: { id: true, nome: true, active: true } },
      },
    })) as Edge[]

    // Prepara próxima iteração
    frontier = []
    for (const e of edges) {
      // Ignora pais inativos ou já visitados (prevenção de ciclos)
      if (!e.parent.active) continue
      if (visited.has(e.parentId)) continue

      // Adiciona pai aos resultados e próxima frontier
      visited.add(e.parentId)
      resultNames.add(e.parent.nome)
      frontier.push(e.parentId)
    }
  }

  return Array.from(resultNames)
}

/**
 * Obtém permissões efetivas de um perfil considerando herança e união por grant verdadeiro.
 *
 * **Lógica de resolução:**
 * 1. Resolve hierarquia completa do perfil
 * 2. Busca todas as permissões dos perfis herdados
 * 3. Aplica união por grant verdadeiro (true override false)
 * 4. Remove duplicatas mantendo apenas resultado final
 *
 * **União por grant verdadeiro:**
 * - Se qualquer perfil na hierarquia tem permitido=true para ação+recurso, resultado é true
 * - Apenas se TODOS os perfis têm permitido=false, resultado é false
 * - Permite hierarquias onde perfis filhos podem conceder permissões negadas pelos pais
 *
 * **Performance:**
 * - Single query para buscar todas as permissões
 * - O(n) para resolução de conflitos onde n = número de permissões
 *
 * @param prisma - Cliente Prisma
 * @param perfilNome - Nome do perfil para resolver permissões
 * @param tables - Configuração de nomes de tabelas
 * @returns Array de permissões efetivas após resolução de herança
 *
 * @example
 * ```ts
 * // Cenário: User tem "Ler Posts" = false, Admin tem "Ler Posts" = true
 * // Usuário com perfil que herda de ambos
 * const permissoes = await getPermissoesPorPerfil(prisma, "Moderator")
 *
 * // Resultado: [{ acao: "Ler", recurso: "Posts", permitido: true }]
 * // União por grant verdadeiro garante acesso mais permissivo
 *
 * // Schema esperado:
 * // Permissao: { acao, recurso, permitido, perfil: { nome, active } }
 * ```
 */
export async function getPermissoesPorPerfil(
  prisma: PrismaLike,
  perfilNome: string,
  tables = defaultTables
): Promise<Array<{ acao: Action; recurso: Resource; permitido: boolean }>> {
  // 1. Resolve hierarquia completa
  const perfisHerdados = await getPerfisHerdadosNomes(prisma, perfilNome, tables)

  // 2. Busca todas as permissões dos perfis herdados
  const Permissao = prisma[tables.permissao] as PrismaModel
  const permissoes = (await Permissao.findMany({
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
  })) as Array<{ acao: Action; recurso: Resource; permitido: boolean }>

  // 3. Aplica união por grant verdadeiro
  const permissoesMap = new Map<
    string,
    { acao: Action; recurso: Resource; permitido: boolean }
  >()

  for (const p of permissoes) {
    const key = `${p.acao}_${p.recurso}`

    // Se não existe ou a atual é permitida, atualiza
    // Isso garante que true sempre override false
    if (!permissoesMap.has(key) || p.permitido) {
      permissoesMap.set(key, {
        acao: p.acao,
        recurso: p.recurso,
        permitido: p.permitido,
      })
    }
  }

  return Array.from(permissoesMap.values())
}

/**
 * Cria um PermissionsProvider integrado ao Prisma ORM.
 *
 * **Funcionalidades:**
 * - Resolução automática de hierarquia de perfis
 * - Configuração flexível de schema
 * - Suporte a identificação por email ou ID
 * - Performance otimizada com queries eficientes
 * - Compatible com withTTLCache para caching
 *
 * **Schema requerido:**
 * ```prisma
 * model User {
 *   id      String  @id
 *   email   String  @unique
 *   perfil  Perfil? @relation(fields: [perfilId], references: [id])
 *   perfilId String?
 * }
 *
 * model Perfil {
 *   id     String  @id
 *   nome   String  @unique
 *   active Boolean @default(true)
 *
 *   users      User[]
 *   permissoes Permissao[]
 *   pais       PerfilHeranca[] @relation("PerfilPais")
 *   filhos     PerfilHeranca[] @relation("PerfilFilhos")
 * }
 *
 * model Permissao {
 *   id        String  @id
 *   acao      String
 *   recurso   String
 *   permitido Boolean
 *
 *   perfil   Perfil @relation(fields: [perfilId], references: [id])
 *   perfilId String
 * }
 *
 * model PerfilHeranca {
 *   parentId String
 *   childId  String
 *
 *   parent Perfil @relation("PerfilPais", fields: [parentId], references: [id])
 *   child  Perfil @relation("PerfilFilhos", fields: [childId], references: [id])
 * }
 * ```
 *
 * @param opts - Opções de configuração do provider
 * @returns PermissionsProvider configurado para Prisma
 *
 * @example
 * ```ts
 * // Configuração básica
 * const provider = createPrismaPermissionsProvider({
 *   prisma: prismaClient
 * })
 *
 * // Com schema personalizado
 * const customProvider = createPrismaPermissionsProvider({
 *   prisma: prismaClient,
 *   tables: {
 *     perfil: "Role",
 *     permissao: "Permission",
 *     perfilHeranca: "RoleHierarchy",
 *     user: "AppUser"
 *   },
 *   identityField: "id"
 * })
 *
 * // Uso com cache
 * const cachedProvider = withTTLCache(provider, { ttl: 5 * 60 * 1000 })
 *
 * // Integração com Next.js
 * export const rbacMiddleware = createRbacMiddleware({
 *   provider: cachedProvider,
 *   getIdentity: nextAuthIdentityResolver
 * })
 * ```
 */
export function createPrismaPermissionsProvider(
  opts: PrismaRbacOptions
): PermissionsProvider {
  const { prisma, tables: partialTables, identityField = "email" } = opts
  const tables = { ...defaultTables, ...partialTables }
  const User = prisma[tables.user] as PrismaModel

  return {
    /**
     * Resolve permissões de um usuário via sua identidade.
     *
     * **Fluxo:**
     * 1. Busca usuário por email ou ID
     * 2. Verifica se tem perfil ativo
     * 3. Resolve permissões via hierarquia
     * 4. Converte para PermissionsMap
     *
     * @param identity - Email ou ID do usuário
     * @returns PermissionsMap resolvido
     */
    async getPermissionsByIdentity(identity: string): Promise<PermissionsMap> {
      // Determina campo de busca baseado na configuração
      const where = identityField === "email" ? { email: identity } : { id: identity }

      // Busca usuário com perfil
      type UsuarioRow = { perfil?: { nome: string; active?: boolean } | null }
      const usuario = (await User.findUnique({
        where,
        include: { perfil: true },
      })) as UsuarioRow | null

      // Usuário não existe ou sem perfil ativo
      if (!usuario?.perfil?.active) return {}

      // Resolve permissões via hierarquia
      const list = await getPermissoesPorPerfil(prisma, usuario.perfil.nome, tables)
      return toPermissionsMap(list)
    },

    /**
     * Invalidação de cache (no-op).
     *
     * Este provider é stateless. O cache fica no decorator withTTLCache
     * se configurado. A invalidação deve ser feita externamente conforme
     * necessário após mudanças no schema RBAC.
     */
    invalidate() {
      // Sem estado aqui: cache fica no decorator withTTLCache
    },
  }
}

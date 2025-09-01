/**
 * @fileoverview Contratos e abstrações para providers de RBAC
 * @version 0.1.0-beta.3
 * @author ANPD/SUPSE
 * @license MIT
 *
 * Este módulo define:
 * - Interfaces padronizadas para providers de permissões
 * - Contratos para resolução de identidade
 * - Sistema de cache TTL para otimização de performance
 */

import type { PermissionsMap } from "@anpdgovbr/rbac-core"

/**
 * Interface principal para providers de permissões.
 *
 * Implementações devem resolver permissões por identidade (email/ID)
 * e fornecer mecanismo de invalidação de cache.
 *
 * @example
 * ```typescript
 * class DatabaseProvider implements PermissionsProvider {
 *   async getPermissionsByIdentity(email: string) {
 *     const user = await db.user.findUnique({ where: { email } })
 *     return resolvePermissions(user)
 *   }
 *
 *   invalidate(email?: string) {
 *     if (email) clearUserCache(email)
 *     else clearAllCache()
 *   }
 * }
 * ```
 */
export interface PermissionsProvider {
  /**
   * Resolve o mapa de permissões para uma identidade específica.
   *
   * @param identity - Email ou ID único do usuário
   * @returns Promise com PermissionsMap resolvido
   * @throws Error se identidade não for encontrada ou inválida
   *
   * @example
   * ```typescript
   * const perms = await provider.getPermissionsByIdentity("user@gov.br")
   * // { "Exibir": { "Relatorios": true } }
   * ```
   */
  getPermissionsByIdentity(identity: string): Promise<PermissionsMap>

  /**
   * Invalida cache de permissões.
   *
   * Chamado após mudanças administrativas que afetam permissões:
   * - Alteração de perfil do usuário
   * - Modificação de permissões de perfil
   * - Mudanças na hierarquia de herança
   *
   * @param identity - Identidade específica para invalidar (opcional)
   *                   Se omitido, invalida todo o cache
   *
   * @example
   * ```typescript
   * // Invalida apenas um usuário
   * provider.invalidate("user@gov.br")
   *
   * // Invalida todo o cache (mudança estrutural)
   * provider.invalidate()
   * ```
   */
  invalidate(identity?: string): void
}

/**
 * Representa a identidade autenticada extraída de um request.
 *
 * @example
 * ```typescript
 * const identity: Identity = {
 *   id: "user123",
 *   email: "user@gov.br"
 * }
 * ```
 */
export interface Identity {
  /** ID único do usuário (obrigatório) */
  id: string
  /** Email do usuário (opcional, mas recomendado) */
  email?: string
}

/**
 * Interface para resolução de identidade a partir de requests.
 *
 * Abstrai diferentes sistemas de autenticação (NextAuth, JWT, etc.)
 * permitindo que o RBAC funcione com qualquer provider de auth.
 *
 * @template Req - Tipo do objeto de request (Request, NextRequest, etc.)
 *
 * @example
 * ```typescript
 * class NextAuthResolver implements IdentityResolver<Request> {
 *   async resolve(req: Request): Promise<Identity> {
 *     const session = await getSession(req)
 *     if (!session) throw new Error("Não autenticado")
 *
 *     return {
 *       id: session.user.id,
 *       email: session.user.email
 *     }
 *   }
 * }
 * ```
 */
export interface IdentityResolver<Req = unknown> {
  /**
   * Extrai e valida a identidade do usuário a partir de um request.
   *
   * @param req - Objeto de request (tipo genérico)
   * @returns Promise com identidade resolvida
   * @throws Error se usuário não estiver autenticado ou token inválido
   *
   * @example
   * ```typescript
   * try {
   *   const identity = await resolver.resolve(request)
   *   console.log(`Usuário autenticado: ${identity.email}`)
   * } catch (error) {
   *   return Response.json({ error: "Não autorizado" }, { status: 401 })
   * }
   * ```
   */
  resolve(req: Req): Promise<Identity>
}

/**
 * Cache entry interno para o sistema TTL.
 * @internal
 */
interface CacheEntry {
  /** Timestamp de expiração (Date.now() + ttlMs) */
  expires: number
  /** Valor cachado */
  value: PermissionsMap
}

/**
 * Decorator que adiciona cache TTL em memória a qualquer PermissionsProvider.
 *
 * **Características:**
 * - Cache por identidade individual
 * - Expiração automática baseada em TTL
 * - Thread-safe para aplicações concorrentes
 * - Invalidação seletiva ou global
 * - Transparente para o provider base
 *
 * **Quando usar:**
 * - Providers que fazem queries custosas (database, APIs externas)
 * - Ambientes com muitas verificações de permissão
 * - Aplicações com alta concorrência
 *
 * **Quando NÃO usar:**
 * - Providers já otimizados (ex: cache Redis)
 * - Aplicações que requerem permissões sempre atualizadas
 * - Ambientes com memória limitada
 *
 * @param provider - Provider base a ser decorado
 * @param ttlMs - Time To Live em milissegundos
 * @returns Provider decorado com cache TTL
 *
 * @example
 * ```typescript
 * const baseProvider = new PrismaPermissionsProvider(prisma)
 *
 * // Cache de 5 minutos
 * const cachedProvider = withTTLCache(baseProvider, 5 * 60 * 1000)
 *
 * // Primeira chamada: consulta o provider base
 * const perms1 = await cachedProvider.getPermissionsByIdentity("user@gov.br")
 *
 * // Segunda chamada: retorna do cache (< 5 min)
 * const perms2 = await cachedProvider.getPermissionsByIdentity("user@gov.br")
 *
 * // Invalidação após mudança administrativa
 * cachedProvider.invalidate("user@gov.br")
 * ```
 */
export function withTTLCache(
  provider: PermissionsProvider,
  ttlMs: number
): PermissionsProvider {
  // Cache em memória: Map<identity, CacheEntry>
  const cache = new Map<string, CacheEntry>()

  /**
   * Busca entrada no cache, removendo se expirada.
   * @internal
   */
  function get(identity: string): CacheEntry | undefined {
    const entry = cache.get(identity)
    if (!entry) return undefined

    // Verifica expiração
    if (entry.expires < Date.now()) {
      cache.delete(identity)
      return undefined
    }

    return entry
  }

  return {
    /**
     * Implementação com cache da resolução de permissões.
     *
     * Fluxo:
     * 1. Verifica cache válido
     * 2. Se hit: retorna valor cachado
     * 3. Se miss: consulta provider base
     * 4. Armazena resultado no cache
     * 5. Retorna resultado
     */
    async getPermissionsByIdentity(identity: string): Promise<PermissionsMap> {
      // Tentativa de cache hit
      const cached = get(identity)
      if (cached) {
        return cached.value
      }

      // Cache miss: consulta provider base
      const value = await provider.getPermissionsByIdentity(identity)

      // Armazena no cache com TTL
      cache.set(identity, {
        expires: Date.now() + ttlMs,
        value,
      })

      return value
    },

    /**
     * Implementação com cache da invalidação.
     *
     * Propaga invalidação para o provider base e limpa cache local.
     */
    invalidate(identity?: string): void {
      if (identity) {
        // Invalidação seletiva
        cache.delete(identity)
      } else {
        // Invalidação global
        cache.clear()
      }

      // Propaga para provider base
      provider.invalidate(identity)
    },
  }
}

import type { PermissionsMap } from '@anpdgovbr/rbac-core'

/**
 * Provider de permissões: resolve PermissionsMap por identidade (e-mail/ID).
 */
export interface PermissionsProvider {
  getPermissionsByIdentity(identity: string): Promise<PermissionsMap>
  invalidate(identity?: string): void
}

/** Representa a identidade autenticada. */
export interface Identity {
  id: string
  email?: string
}

/** Resolve a identidade do request (ex.: NextAuth, header customizado). */
export interface IdentityResolver<Req = any> {
  resolve(req: Req): Promise<Identity>
}

/**
 * Decorator com cache TTL em memória para qualquer PermissionsProvider.
 * Chame provider.invalidate() após alterações administrativas de permissões.
 */
export function withTTLCache(provider: PermissionsProvider, ttlMs: number): PermissionsProvider {
  const cache = new Map<string, { expires: number; value: PermissionsMap }>()
  function get(identity: string): { expires: number; value: PermissionsMap } | undefined {
    const entry = cache.get(identity)
    if (!entry) return undefined
    if (entry.expires < Date.now()) {
      cache.delete(identity)
      return undefined
    }
    return entry
  }
  return {
    async getPermissionsByIdentity(identity: string) {
      const cached = get(identity)
      if (cached) return cached.value
      const value = await provider.getPermissionsByIdentity(identity)
      cache.set(identity, { expires: Date.now() + ttlMs, value })
      return value
    },
    invalidate(identity?: string) {
      if (identity) cache.delete(identity)
      else cache.clear()
      provider.invalidate(identity)
    },
  }
}

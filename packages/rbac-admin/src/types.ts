export type Profile = { id: string | number; nome: string; active?: boolean }
export type Permission = { acao: string; recurso: string; permitido: boolean }

export type AdminEndpoints = {
  profiles: string // ex: "/api/perfis"
  permissions: (profileIdOrName: string | number) => string // ex: (id) => `/api/permissoes?perfil=${id}`
  toggle: string // ex: "/api/permissoes/toggle"
}

export type AdminClientConfig = {
  baseUrl?: string
  endpoints?: Partial<AdminEndpoints>
  fetchImpl?: typeof fetch
  headers?: Record<string, string>
}

export type AdminClient = {
  listProfiles(): Promise<Profile[]>
  listPermissions(profileIdOrName: string | number): Promise<Permission[]>
  togglePermission(input: { profileIdOrName: string | number; acao: string; recurso: string; permitido: boolean }): Promise<{ ok: boolean }>
}

export function createRbacAdminClient(cfg: AdminClientConfig = {}): AdminClient {
  const baseUrl = cfg.baseUrl ?? ''
  const endpoints: AdminEndpoints = {
    profiles: '/api/perfis',
    permissions: (id) => `/api/permissoes?perfil=${encodeURIComponent(String(id))}`,
    toggle: '/api/permissoes/toggle',
    ...(cfg.endpoints ?? {}),
  } as AdminEndpoints
  const doFetch = cfg.fetchImpl ?? fetch

  const withBase = (path: string) => (baseUrl ? `${baseUrl}${path}` : path)
  const headers = { 'Content-Type': 'application/json', ...(cfg.headers ?? {}) }

  return {
    async listProfiles() {
      const r = await doFetch(withBase(endpoints.profiles), { headers })
      if (!r.ok) throw new Error('Falha ao listar perfis')
      return (await r.json()) as Profile[]
    },
    async listPermissions(profileIdOrName) {
      const path = endpoints.permissions(profileIdOrName)
      const r = await doFetch(withBase(path), { headers })
      if (!r.ok) throw new Error('Falha ao listar permissões')
      return (await r.json()) as Permission[]
    },
    async togglePermission(input) {
      const r = await doFetch(withBase(endpoints.toggle), {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      })
      return { ok: r.ok }
    },
  }
}


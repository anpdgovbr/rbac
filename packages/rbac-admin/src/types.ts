import type {
  PerfilDto,
  PermissaoDto,
  UserDto,
  AssignUserProfilePayload,
  TogglePermissionPayload,
} from "@anpdgovbr/shared-types"
export type Profile = PerfilDto
export type Permission = Pick<PermissaoDto, "acao" | "recurso" | "permitido">

export type AdminEndpoints = {
  profiles: string
  createProfile: string
  permissions: (profileIdOrName: string | number) => string
  toggle: string
  createPermission: string
  users: string
  patchUser: (userId: string) => string
}

export type AdminClientConfig = {
  baseUrl?: string
  endpoints?: Partial<AdminEndpoints>
  fetchImpl?: typeof fetch
  headers?: Record<string, string>
}

export type AdminClient = {
  listProfiles(): Promise<Profile[]>
  createProfile(data: { nome: string }): Promise<{ ok: boolean; profile: Profile }>
  listPermissions(profileIdOrName: string | number): Promise<Permission[]>
  togglePermission(input: {
    profileIdOrName: string | number
    acao: string
    recurso: string
    permitido: boolean
  }): Promise<{ ok: boolean }>
  createPermission(payload: TogglePermissionPayload): Promise<{ ok: boolean }>
  listUsers(): Promise<Array<Pick<UserDto, "id" | "email" | "nome" | "perfilId">>>
  assignUserProfile(userId: string, perfilId: number | null): Promise<{ ok: boolean }>
}

export function createRbacAdminClient(cfg: AdminClientConfig = {}): AdminClient {
  const baseUrl = cfg.baseUrl ?? ""
  const endpoints: AdminEndpoints = {
    profiles: "/api/perfis",
    createProfile: "/api/perfis",
    permissions: (id) => `/api/permissoes?perfil=${encodeURIComponent(String(id))}`,
    toggle: "/api/permissoes/toggle",
    createPermission: "/api/permissoes",
    users: "/api/usuarios",
    patchUser: (id) => `/api/usuarios/${encodeURIComponent(String(id))}`,
    ...(cfg.endpoints ?? {}),
  }
  const doFetch = cfg.fetchImpl ?? fetch

  const withBase = (path: string) => (baseUrl ? `${baseUrl}${path}` : path)
  const headers = { "Content-Type": "application/json", ...(cfg.headers ?? {}) }

  return {
    async listProfiles() {
      const r = await doFetch(withBase(endpoints.profiles), { headers })
      if (!r.ok) throw new Error("Falha ao listar perfis")
      return (await r.json()) as Profile[]
    },
    async createProfile(data) {
      const r = await doFetch(withBase(endpoints.createProfile), {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })
      const profile = await r.json()
      return { ok: r.ok, profile }
    },
    async listPermissions(profileIdOrName) {
      const path = endpoints.permissions(profileIdOrName)
      const r = await doFetch(withBase(path), { headers })
      if (!r.ok) throw new Error("Falha ao listar permissões")
      return (await r.json()) as Permission[]
    },
    async togglePermission(input) {
      const r = await doFetch(withBase(endpoints.toggle), {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      })
      return { ok: r.ok }
    },
    async createPermission(payload) {
      const r = await doFetch(withBase(endpoints.createPermission), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
      return { ok: r.ok }
    },
    async listUsers() {
      const r = await doFetch(withBase(endpoints.users), { headers })
      if (!r.ok) throw new Error("Falha ao listar usuários")
      return (await r.json()) as Array<
        Pick<UserDto, "id" | "email" | "nome" | "perfilId">
      >
    },
    async assignUserProfile(userId, perfilId) {
      const payload: AssignUserProfilePayload = { userId, perfilId }
      const r = await doFetch(withBase(endpoints.patchUser(userId)), {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      })
      return { ok: r.ok }
    },
  }
}
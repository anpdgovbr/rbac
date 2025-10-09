import type {
  PerfilDto,
  PermissaoDto,
  UserDto,
  AssignUserProfilePayload,
  TogglePermissionPayload,
} from "@anpdgovbr/shared-types"
import { z } from "zod"

// Schemas de validação
const CreateProfileSchema = z.object({
  nome: z.string().min(1, "Nome do perfil é obrigatório").max(100, "Nome muito longo"),
})

const TogglePermissionSchema = z.object({
  profileIdOrName: z.union([z.string().min(1), z.number().int().positive()]),
  acao: z.string().min(1, "Ação é obrigatória"),
  recurso: z.string().min(1, "Recurso é obrigatório"),
  permitido: z.boolean(),
})

const CreatePermissionSchema = z.object({
  perfilId: z.number().int().positive("ID do perfil inválido"),
  acao: z.string().min(1, "Ação é obrigatória"),
  recurso: z.string().min(1, "Recurso é obrigatório"),
  permitido: z.boolean(),
})

const AssignUserProfileSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  perfilId: z.number().int().positive("ID do perfil inválido").nullable(),
})

/**
 * Tipo que representa um perfil de usuário, baseado no DTO PerfilDto.
 */
export type Profile = PerfilDto

/**
 * Tipo que representa uma permissão, contendo apenas as propriedades 'acao', 'recurso' e 'permitido' do DTO PermissaoDto.
 */
export type Permission = Pick<PermissaoDto, "acao" | "recurso" | "permitido">

/**
 * Tipo que define os endpoints da API de administração RBAC.
 */
export type AdminEndpoints = {
  profiles: string
  createProfile: string
  permissions: (profileIdOrName: string | number) => string
  toggle: string
  createPermission: string
  users: string
  patchUser: (userId: string) => string
}

/**
 * Tipo que define a configuração para o cliente de administração RBAC.
 */
export type AdminClientConfig = {
  baseUrl?: string
  endpoints?: Partial<AdminEndpoints>
  fetchImpl?: typeof fetch
  headers?: Record<string, string>
}

/**
 * Tipo que define a interface do cliente de administração RBAC, com métodos para gerenciar perfis, permissões e usuários.
 */
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

/**
 * Cria uma instância do cliente de administração RBAC com base na configuração fornecida.
 * @param cfg - Configuração opcional para o cliente, incluindo URL base, endpoints personalizados, implementação de fetch e cabeçalhos.
 * @returns Uma instância do AdminClient com métodos para interagir com a API RBAC.
 */
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
      // Validação de input
      const validated = CreateProfileSchema.parse(data)
      const r = await doFetch(withBase(endpoints.createProfile), {
        method: "POST",
        headers,
        body: JSON.stringify(validated),
      })
      const profile = await r.json()
      return { ok: r.ok, profile }
    },
    async listPermissions(profileIdOrName) {
      // Validação básica
      if (typeof profileIdOrName === "string" && !profileIdOrName.trim()) {
        throw new Error("ID ou nome do perfil inválido")
      }
      if (typeof profileIdOrName === "number" && profileIdOrName <= 0) {
        throw new Error("ID do perfil deve ser positivo")
      }
      const path = endpoints.permissions(profileIdOrName)
      const r = await doFetch(withBase(path), { headers })
      if (!r.ok) throw new Error("Falha ao listar permissões")
      return (await r.json()) as Permission[]
    },
    async togglePermission(input) {
      // Validação de input
      const validated = TogglePermissionSchema.parse(input)
      const r = await doFetch(withBase(endpoints.toggle), {
        method: "POST",
        headers,
        body: JSON.stringify(validated),
      })
      return { ok: r.ok }
    },
    async createPermission(payload) {
      // Validação de input
      const validated = CreatePermissionSchema.parse(payload)
      const r = await doFetch(withBase(endpoints.createPermission), {
        method: "POST",
        headers,
        body: JSON.stringify(validated),
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
      // Validação de input
      const validated = AssignUserProfileSchema.parse({ userId, perfilId })
      const payload: AssignUserProfilePayload = validated
      const r = await doFetch(withBase(endpoints.patchUser(validated.userId)), {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      })
      return { ok: r.ok }
    },
  }
}

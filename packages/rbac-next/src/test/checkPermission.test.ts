import assert from "node:assert"
import { describe, it } from "node:test"
import { checkPermission, UnauthenticatedError, ForbiddenError } from "../index.js"
import type { Identity, PermissionsProvider } from "@anpdgovbr/rbac-provider"
import type { PermissionsMap } from "@anpdgovbr/rbac-core"

// mocks
const makeIdentityResolver = (identity: Partial<Identity> | Error) => ({
  async resolve(_req?: Request) {
    if (identity instanceof Error) throw identity
    return identity as Identity
  },
})

const makeProvider = (perms: PermissionsMap): PermissionsProvider => ({
  async getPermissionsByIdentity(_email: string) {
    return perms
  },
  invalidate() {},
})

describe("checkPermission", () => {
  it("resolves when allowed", async () => {
    const identity = { id: "u1", email: "u1@example.com" }
    const _resolver = makeIdentityResolver(identity)
    const _provider = makeProvider({ Exibir: { Permissoes: true } })

    const out = await checkPermission(
      {
        getIdentity: makeIdentityResolver(identity),
        provider: makeProvider({ Exibir: { Permissoes: true } }),
        permissao: { acao: "Exibir", recurso: "Permissoes" },
      },
      new Request("http://localhost/")
    )
    assert.strictEqual(out.email, "u1@example.com")
  })

  it("throws UnauthenticatedError when not authenticated", async () => {
    await assert.rejects(async () => {
      await checkPermission(
        {
          getIdentity: makeIdentityResolver(new Error("No auth")),
          provider: makeProvider({}),
          permissao: { acao: "Exibir", recurso: "Permissoes" },
        },
        new Request("http://localhost/")
      )
    }, UnauthenticatedError)
  })

  it("throws ForbiddenError when not allowed", async () => {
    const identity = { id: "u2", email: "u2@example.com" }

    await assert.rejects(async () => {
      await checkPermission(
        {
          getIdentity: makeIdentityResolver(identity),
          provider: makeProvider({ Exibir: { Permissoes: false } }),
          permissao: { acao: "Exibir", recurso: "Permissoes" },
        },
        new Request("http://localhost/")
      )
    }, ForbiddenError)
  })
})

import assert from "node:assert"
import { describe, it } from "node:test"
import { checkPermission, UnauthenticatedError, ForbiddenError } from "../index.js"

// mocks
const makeIdentityResolver = (identity: any) => ({
  async resolve(_req: Request) {
    if (identity instanceof Error) throw identity
    return identity
  },
})

const makeProvider = (perms: any) => ({
  async getPermissionsByIdentity(_email: string) {
    return perms
  },
})

describe("checkPermission", () => {
  it("resolves when allowed", async () => {
    const identity = { id: "u1", email: "u1@example.com" }
    const resolver = makeIdentityResolver(identity)
    const provider = makeProvider({ Exibir: { Permissoes: true } })

    const out = await checkPermission(
      {
        getIdentity: resolver as any,
        provider: provider as any,
        permissao: { acao: "Exibir", recurso: "Permissoes" },
      },
      new Request("http://localhost/")
    )
    assert.strictEqual(out.email, "u1@example.com")
  })

  it("throws UnauthenticatedError when not authenticated", async () => {
    const resolver = makeIdentityResolver({} as any)
    const provider = makeProvider({})

    await assert.rejects(async () => {
      await checkPermission(
        {
          getIdentity: resolver as any,
          provider: provider as any,
          permissao: { acao: "Exibir", recurso: "Permissoes" },
        },
        new Request("http://localhost/")
      )
    }, UnauthenticatedError)
  })

  it("throws ForbiddenError when not allowed", async () => {
    const identity = { id: "u2", email: "u2@example.com" }
    const resolver = makeIdentityResolver(identity)
    const provider = makeProvider({ Exibir: { Permissoes: false } })

    await assert.rejects(async () => {
      await checkPermission(
        {
          getIdentity: resolver as any,
          provider: provider as any,
          permissao: { acao: "Exibir", recurso: "Permissoes" },
        },
        new Request("http://localhost/")
      )
    }, ForbiddenError)
  })
})

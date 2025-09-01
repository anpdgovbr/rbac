import test from "node:test"
import assert from "node:assert/strict"
import { withApi } from "../src/index.js"
import type { PermissionsProvider, IdentityResolver } from "@anpdgovbr/rbac-provider"

test("withApi denies when permission missing", async () => {
  const handler = async () => new Response("ok")
  const provider: PermissionsProvider = {
    async getPermissionsByIdentity() {
      return {}
    },
    invalidate() {},
  }
  const getIdentity: IdentityResolver<Request> = {
    async resolve() {
      return { id: "1", email: "a@x" }
    },
  }
  const GET = withApi(handler, {
    provider,
    getIdentity,
    permissao: { acao: "Exibir", recurso: "Permissoes" },
  })
  const res = await GET(new Request("http://local"))
  assert.equal(res.status, 403)
})

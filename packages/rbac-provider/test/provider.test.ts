import test from "node:test"
import assert from "node:assert/strict"
import { withTTLCache, type PermissionsProvider } from "../src/index.js"

test("withTTLCache caches and invalidates", async () => {
  let calls = 0
  const base: PermissionsProvider = {
    async getPermissionsByIdentity() {
      calls++
      return { Exibir: { Permissoes: true } }
    },
    invalidate() {},
  }
  const provider = withTTLCache(base, 1000)
  await provider.getPermissionsByIdentity("a@x")
  await provider.getPermissionsByIdentity("a@x")
  assert.equal(calls, 1)
  provider.invalidate("a@x")
  await provider.getPermissionsByIdentity("a@x")
  assert.equal(calls, 2)
})

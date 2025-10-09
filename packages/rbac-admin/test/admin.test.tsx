import test from "node:test"
import assert from "node:assert/strict"
import { RbacAdminShell, createRbacAdminClient } from "../src/index.js"

test("createRbacAdminClient should create a client instance", () => {
  const client = createRbacAdminClient({
    fetchImpl: () => Promise.resolve(new Response("[]")),
  })

  assert.ok(typeof client.listProfiles === "function")
  assert.ok(typeof client.createProfile === "function")
  assert.ok(typeof client.listPermissions === "function")
  assert.ok(typeof client.togglePermission === "function")
})

test("RbacAdminShell should be exported as a function component", () => {
  assert.ok(typeof RbacAdminShell === "function")
})

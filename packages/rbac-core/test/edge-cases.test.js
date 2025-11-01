import test from "node:test"
import assert from "node:assert/strict"
import { toPermissionsMap, pode, hasAny } from "../src/index.js"
test("toPermissionsMap handles nil or empty lists", () => {
  assert.deepStrictEqual(
    toPermissionsMap(null),
    {},
    "Should return empty map for null input"
  )
  assert.deepStrictEqual(
    toPermissionsMap(undefined),
    {},
    "Should return empty map for undefined input"
  )
  assert.deepStrictEqual(
    toPermissionsMap([]),
    {},
    "Should return empty map for empty array"
  )
})
test("toPermissionsMap ignores prototype-polluting keys", () => {
  const maliciousList = [
    { acao: "__proto__", recurso: "polluted", permitido: true },
    { acao: "constructor", recurso: "polluted", permitido: true },
    { acao: "prototype", recurso: "polluted", permitido: true },
  ]
  const perms = toPermissionsMap(maliciousList)
  assert.deepStrictEqual(perms, {}, "Should not process prototype-polluting keys")
  // Verify that the prototype was not polluted
  const obj = {}
  assert.strictEqual(obj.polluted, undefined)
})
test("pode and hasAny handle empty permissions map", () => {
  const emptyPerms = {}
  assert.strictEqual(
    pode(emptyPerms, "Exibir", "Recurso"),
    false,
    "pode should return false for empty map"
  )
  assert.strictEqual(
    hasAny(emptyPerms, [["Exibir", "Recurso"]]),
    false,
    "hasAny should return false for empty map"
  )
})

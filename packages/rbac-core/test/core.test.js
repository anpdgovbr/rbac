import test from "node:test"
import assert from "node:assert/strict"
import { toPermissionsMap, pode, hasAny } from "../src/index.js"
test("toPermissionsMap + pode/hasAny", () => {
  const list = [
    { acao: "Exibir", recurso: "Permissoes", permitido: true },
    { acao: "Editar", recurso: "Permissoes", permitido: false },
  ]
  const perms = toPermissionsMap(list)
  assert.equal(pode(perms, "Exibir", "Permissoes"), true)
  assert.equal(pode(perms, "Editar", "Permissoes"), false)
  assert.equal(
    hasAny(perms, [
      ["Editar", "Permissoes"],
      ["Exibir", "Permissoes"],
    ]),
    true
  )
})

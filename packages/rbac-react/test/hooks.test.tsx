import test from "node:test"
import assert from "node:assert/strict"
// Importar apenas as funções, não os hooks para evitar problemas de renderização
import { toPermissionsMap, pode } from "@anpdgovbr/rbac-core"

// Testes das funções utilitárias que não dependem de React render
test("toPermissionsMap works correctly", () => {
  const permissionsList = [
    { acao: "Exibir", recurso: "Painel", permitido: true },
    { acao: "Editar", recurso: "Painel", permitido: false },
  ]
  const result = toPermissionsMap(permissionsList)
  assert.deepStrictEqual(result, { Exibir: { Painel: true }, Editar: { Painel: false } })
})

test("pode function works correctly", () => {
  const permissions = { Exibir: { Painel: true }, Editar: { Painel: false } }
  assert.strictEqual(pode(permissions, "Exibir", "Painel"), true)
  assert.strictEqual(pode(permissions, "Editar", "Painel"), false)
  assert.strictEqual(pode(permissions, "Criar", "Painel"), false)
})

test("pode handles empty permissions", () => {
  const permissions = {}
  assert.strictEqual(pode(permissions, "Exibir", "Painel"), false)
})

// Teste simples que verifica se as exportações existem
test("exports should be available", async () => {
  const module = await import("../src/index.js")
  assert.ok(module.PermissionsProvider, "PermissionsProvider should be exported")
  assert.ok(module.usePermissions, "usePermissions should be exported")
  assert.ok(module.usePode, "usePode should be exported")
})

import test from "node:test"
import assert from "node:assert/strict"
import React from "react"
import {
  PermissionsProvider,
  withPermissao,
  usePermissions,
  usePode,
} from "../src/index.js"

const MockComponent = () => React.createElement("div", {}, "Allowed")

test("should export all required functions", () => {
  assert.ok(typeof PermissionsProvider === "function")
  assert.ok(typeof withPermissao === "function")
  assert.ok(typeof usePermissions === "function")
  assert.ok(typeof usePode === "function")
})

test("withPermissao should return a component", () => {
  const Protected = withPermissao(MockComponent, "Exibir", "Painel")
  assert.ok(typeof Protected === "function")
})

test("PermissionsProvider should create context provider", () => {
  const permissions = { Exibir: { Painel: true } }
  const Provider = PermissionsProvider({
    value: permissions,
    children: React.createElement("div"),
  })
  assert.ok(Provider !== null)
})

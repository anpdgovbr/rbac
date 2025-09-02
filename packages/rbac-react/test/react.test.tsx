import test from "node:test"
import assert from "node:assert/strict"
import React from "react"
import { render, screen } from "@testing-library/react"
import { PermissionsProvider, withPermissao } from "../src/index.js"

const MockComponent = () => <div>Allowed</div>

test("rbac-react HOC withPermissao", () => {
  test("should render component when permission is present", () => {
    const permissions = { Exibir: { Painel: true } }
    const Protected = withPermissao(MockComponent, "Exibir", "Painel")
    render(
      <PermissionsProvider value={permissions}>
        <Protected />
      </PermissionsProvider>
    )
    assert.ok(screen.getByText("Allowed"))
  })

  test("should not render component when permission is missing", () => {
    const permissions = {}
    const Protected = withPermissao(MockComponent, "Exibir", "Painel")
    render(
      <PermissionsProvider value={permissions}>
        <Protected />
      </PermissionsProvider>
    )
    assert.strictEqual(screen.queryByText("Allowed"), null)
  })

  test("should show access denied message if redirect is false", () => {
    const permissions = {}
    const Protected = withPermissao(MockComponent, "Exibir", "Painel", {
      redirect: false,
    })
    render(
      <PermissionsProvider value={permissions}>
        <Protected />
      </PermissionsProvider>
    )
    assert.ok(screen.getByText("Acesso negado"))
  })
})

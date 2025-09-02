import test from "node:test"
import assert from "node:assert/strict"
import React from "react"
import { render, screen } from "@testing-library/react"
import { RbacAdminShell } from "../src/index.js"

test("rbac-admin component tests", () => {
  test("RbacAdminShell should render the main title", () => {
    render(
      <RbacAdminShell config={{ fetchImpl: () => Promise.resolve(new Response("[]")) }} />
    )
    assert.ok(screen.getByText("RBAC Admin"))
  })
})

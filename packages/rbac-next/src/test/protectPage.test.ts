import assert from "node:assert"
import { describe, it } from "node:test"
import React from "react"
import {
  protectPage,
  UnauthenticatedError,
  type CheckPermissionOptions,
} from "../index.js"

const MockClient = (props: React.PropsWithChildren) =>
  React.createElement("div", props, "ok")

describe("protectPage", () => {
  it("calls redirectFn when unauthenticated", async () => {
    const redirectCalls: string[] = []
    const redirectFn = (url: string) => {
      redirectCalls.push(url)
      throw new UnauthenticatedError("Redirected")
    }

    const opts: CheckPermissionOptions = {
      getIdentity: {
        async resolve() {
          throw new Error("No auth")
        },
      },
      provider: {
        async getPermissionsByIdentity() {
          return {}
        },
        invalidate() {},
      },
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    }

    const Page = protectPage(
      MockClient as React.ComponentType<Record<string, unknown>>,
      opts,
      {
        redirects: { unauth: "/login", forbidden: "/acesso-negado" },
        redirectFn,
      }
    )

    await assert.rejects(async () => {
      await Page({})
    }, UnauthenticatedError)
    assert.deepStrictEqual(redirectCalls, ["/login"])
  })

  it("returns element when authorized", async () => {
    const opts: CheckPermissionOptions = {
      getIdentity: {
        async resolve() {
          return { id: "u1", email: "u1@example.com" }
        },
      },
      provider: {
        async getPermissionsByIdentity() {
          return { Exibir: { Permissoes: true } }
        },
        invalidate() {},
      },
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    }

    const Page = protectPage(
      MockClient as React.ComponentType<Record<string, unknown>>,
      opts
    )
    const el = await Page({ test: 1 })
    // React element representation should have type MockClient (component)
    assert.strictEqual(el.type, MockClient)
  })
})

import assert from "node:assert"
import { describe, it } from "node:test"
import React from "react"
import { protectPage, UnauthenticatedError, ForbiddenError } from "../index.js"

const MockClient = (props: any) => React.createElement("div", props, "ok")

describe("protectPage", () => {
  it("calls redirectFn when unauthenticated", async () => {
    const redirectCalls: string[] = []
    const redirectFn = (url: string) => {
      redirectCalls.push(url)
      throw new UnauthenticatedError()
    }

    const opts = {
      getIdentity: {
        async resolve() {
          return {}
        },
      },
      provider: {
        async getPermissionsByIdentity() {
          return {}
        },
      },
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    }

    const Page = protectPage(MockClient as any, opts as any, {
      redirects: { unauth: "/login", forbidden: "/acesso-negado" },
      redirectFn,
    })

    await assert.rejects(async () => {
      await Page({})
    }, UnauthenticatedError)
    assert.deepStrictEqual(redirectCalls, ["/login"])
  })

  it("returns element when authorized", async () => {
    const opts = {
      getIdentity: {
        async resolve() {
          return { id: "u1", email: "u1@example.com" }
        },
      },
      provider: {
        async getPermissionsByIdentity() {
          return { Exibir: { Permissoes: true } }
        },
      },
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    }

    const Page = protectPage(MockClient as any, opts as any)
    const el = await Page({ test: 1 })
    // React element representation should have type MockClient (component)
    assert.strictEqual(el.type, MockClient)
  })
})

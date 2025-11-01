import test from "node:test"
import assert from "node:assert/strict"
import { createRbacAdminClient } from "../src/index.js"

test("AdminClient - listProfiles", async () => {
  const mockProfiles = [
    { id: 1, nome: "Admin", descricao: "Administrador" },
    { id: 2, nome: "User", descricao: "Usuário comum" },
  ]

  const client = createRbacAdminClient({
    fetchImpl: async () =>
      new Response(JSON.stringify(mockProfiles), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  })

  const profiles = await client.listProfiles()
  assert.equal(profiles.length, 2)
  assert.equal(profiles[0].nome, "Admin")
  assert.equal(profiles[1].nome, "User")
})

test("AdminClient - listProfiles should throw on HTTP error", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("Error", { status: 500 }),
  })

  await assert.rejects(client.listProfiles(), {
    message: "Falha ao listar perfis",
  })
})

test("AdminClient - createProfile", async () => {
  const newProfile = { id: 3, nome: "Editor", descricao: "Editor de conteúdo" }

  const client = createRbacAdminClient({
    fetchImpl: async () =>
      new Response(JSON.stringify(newProfile), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
  })

  const result = await client.createProfile({ nome: "Editor" })
  assert.ok(result.ok)
  assert.equal(result.profile.nome, "Editor")
})

test("AdminClient - createProfile should validate input", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  // Nome vazio deve falhar
  await assert.rejects(client.createProfile({ nome: "" }), /Nome do perfil é obrigatório/)

  // Nome muito longo deve falhar
  await assert.rejects(
    client.createProfile({ nome: "a".repeat(101) }),
    /Nome muito longo/
  )
})

test("AdminClient - listPermissions", async () => {
  const mockPermissions = [
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "users", permitido: false },
  ]

  const client = createRbacAdminClient({
    fetchImpl: async () =>
      new Response(JSON.stringify(mockPermissions), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  })

  const permissions = await client.listPermissions(1)
  assert.equal(permissions.length, 2)
  assert.equal(permissions[0].acao, "READ")
  assert.equal(permissions[1].acao, "WRITE")
})

test("AdminClient - listPermissions should validate profileIdOrName", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  // String vazia deve falhar
  await assert.rejects(client.listPermissions(""), /ID ou nome do perfil inválido/)

  // ID negativo deve falhar
  await assert.rejects(client.listPermissions(-1), /ID do perfil deve ser positivo/)

  // ID zero deve falhar
  await assert.rejects(client.listPermissions(0), /ID do perfil deve ser positivo/)
})

test("AdminClient - togglePermission", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  const result = await client.togglePermission({
    profileIdOrName: 1,
    acao: "READ",
    recurso: "users",
    permitido: true,
  })

  assert.ok(result.ok)
})

test("AdminClient - togglePermission should validate input", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  // Ação vazia deve falhar
  await assert.rejects(
    client.togglePermission({
      profileIdOrName: 1,
      acao: "",
      recurso: "users",
      permitido: true,
    }),
    /Ação é obrigatória/
  )

  // Recurso vazio deve falhar
  await assert.rejects(
    client.togglePermission({
      profileIdOrName: 1,
      acao: "READ",
      recurso: "",
      permitido: true,
    }),
    /Recurso é obrigatório/
  )
})

test("AdminClient - createPermission", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 201 }),
  })

  const result = await client.createPermission({
    perfilId: 1,
    acao: "DELETE",
    recurso: "posts",
    permitido: false,
  })

  assert.ok(result.ok)
})

test("AdminClient - createPermission should validate input", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  // perfilId inválido deve falhar
  await assert.rejects(
    client.createPermission({
      perfilId: -1,
      acao: "READ",
      recurso: "users",
      permitido: true,
    }),
    /ID do perfil inválido/
  )

  // Ação vazia deve falhar
  await assert.rejects(
    client.createPermission({
      perfilId: 1,
      acao: "",
      recurso: "users",
      permitido: true,
    }),
    /Ação é obrigatória/
  )
})

test("AdminClient - listUsers", async () => {
  const mockUsers = [
    { id: "1", email: "admin@test.com", nome: "Admin", perfilId: 1 },
    { id: "2", email: "user@test.com", nome: "User", perfilId: 2 },
  ]

  const client = createRbacAdminClient({
    fetchImpl: async () =>
      new Response(JSON.stringify(mockUsers), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  })

  const users = await client.listUsers()
  assert.equal(users.length, 2)
  assert.equal(users[0].email, "admin@test.com")
  assert.equal(users[1].nome, "User")
})

test("AdminClient - listUsers should throw on HTTP error", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("Error", { status: 500 }),
  })

  await assert.rejects(client.listUsers(), {
    message: "Falha ao listar usuários",
  })
})

test("AdminClient - assignUserProfile", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  const result = await client.assignUserProfile("user-123", 2)
  assert.ok(result.ok)
})

test("AdminClient - assignUserProfile with null perfilId", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  const result = await client.assignUserProfile("user-123", null)
  assert.ok(result.ok)
})

test("AdminClient - assignUserProfile should validate input", async () => {
  const client = createRbacAdminClient({
    fetchImpl: async () => new Response("OK", { status: 200 }),
  })

  // userId vazio deve falhar
  await assert.rejects(client.assignUserProfile("", 1), /ID do usuário é obrigatório/)

  // perfilId inválido deve falhar
  await assert.rejects(client.assignUserProfile("user-123", -1), /ID do perfil inválido/)
})

test("AdminClient - custom baseUrl", async () => {
  let capturedUrl = ""

  const client = createRbacAdminClient({
    baseUrl: "https://api.example.com",
    fetchImpl: async (url) => {
      capturedUrl = url.toString()
      return new Response("[]", { status: 200 })
    },
  })

  await client.listProfiles()
  assert.ok(capturedUrl.startsWith("https://api.example.com"))
})

test("AdminClient - custom headers", async () => {
  let capturedHeaders: Record<string, string> | undefined

  const client = createRbacAdminClient({
    headers: { Authorization: "Bearer token123" },
    fetchImpl: async (_url, options) => {
      capturedHeaders = options?.headers as Record<string, string>
      return new Response("[]", { status: 200 })
    },
  })

  await client.listProfiles()
  assert.ok(capturedHeaders)
  assert.equal(capturedHeaders.Authorization, "Bearer token123")
})

test("AdminClient - custom endpoints", async () => {
  let capturedUrl = ""

  const client = createRbacAdminClient({
    endpoints: {
      profiles: "/custom/profiles",
    },
    fetchImpl: async (url) => {
      capturedUrl = url.toString()
      return new Response("[]", { status: 200 })
    },
  })

  await client.listProfiles()
  assert.ok(capturedUrl.includes("/custom/profiles"))
})

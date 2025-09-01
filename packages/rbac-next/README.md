# @anpdgovbr/rbac-next

[![npm version](https://img.shields.io/npm/v/@anpdgovbr/rbac-next.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-next)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter Next.js para RBAC** — Middleware e wrappers para App Router com autorização e auditoria integradas.

## ✨ Características

- 🛡️ **Proteção de APIs** — Middleware declarativo para routes
- 🎯 **App Router** — Suporte nativo ao Next.js 15+ App Router
- 📝 **Auditoria Integrada** — Logs automáticos de ações e acessos
- 🔌 **Pluggable** — Funciona com qualquer provider de permissões
- ⚡ **Performance** — Execução eficiente com minimal overhead

## 📦 Instalação

```bash
npm install @anpdgovbr/rbac-next@beta
```

**Peer Dependencies:**

```bash
npm install @anpdgovbr/rbac-core @anpdgovbr/rbac-provider
```

## 🎯 Uso Básico

### 1. API Route Simples

```typescript
// app/api/relatorios/route.ts
import { withApi } from "@anpdgovbr/rbac-next"

export const GET = withApi(
  async ({ email, userId }) => {
    // Sua lógica aqui - usuário já foi autorizado
    const relatorios = await getRelatoriosPorUsuario(userId)
    return Response.json(relatorios)
  },
  {
    provider: permissionsProvider,
    getIdentity: identityResolver,
    permissao: { acao: "Exibir", recurso: "Relatorios" },
  }
)
```

### 2. API Route com Parâmetros

```typescript
// app/api/relatorios/[id]/route.ts
import { withApiForId } from "@anpdgovbr/rbac-next"

export const GET = withApiForId(
  async ({ params, email, userId }) => {
    const relatorio = await getRelatorio(params.id)
    return Response.json(relatorio)
  },
  {
    provider: permissionsProvider,
    getIdentity: identityResolver,
    permissao: { acao: "Exibir", recurso: "Relatorios" },
  }
)

export const DELETE = withApiForId(
  async ({ params, userId }) => {
    const relatorio = await getRelatorio(params.id)
    await deleteRelatorio(params.id)

    return {
      response: Response.json({ success: true }),
      audit: {
        antes: relatorio,
        depois: null,
      },
    }
  },
  {
    provider: permissionsProvider,
    getIdentity: identityResolver,
    permissao: { acao: "Excluir", recurso: "Relatorios" },
    tabela: "relatorios",
    acao: "DELETE",
    audit: auditLogger,
  }
)
```

### 3. Configuração de Providers

```typescript
// lib/rbac-config.ts
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { withTTLCache } from "@anpdgovbr/rbac-provider"
import { getServerSession } from "next-auth"

// Provider de permissões
export const permissionsProvider = withTTLCache(
  createPrismaPermissionsProvider({ prisma }),
  5 * 60 * 1000 // 5 minutos
)

// Resolver de identidade
export const identityResolver = {
  async resolve(req: Request) {
    const session = await getServerSession()

    if (!session?.user?.email) {
      throw new Error("Usuário não autenticado")
    }

    return {
      id: session.user.id,
      email: session.user.email,
    }
  },
}

// Logger de auditoria
export const auditLogger = async (args: AuditArgs) => {
  await prisma.auditLog.create({
    data: {
      tabela: args.tabela,
      acao: args.acao,
      userId: args.userId,
      email: args.email,
      antes: args.antes,
      depois: args.depois,
      contexto: args.contexto,
      timestamp: new Date(),
    },
  })
}
```

## 🔧 API Completa

### `withApi(handler, options)`

Wrapper para routes sem parâmetros dinâmicos.

```typescript
interface WithApiOptions<TParams = {}> {
  // Permissão requerida (opcional)
  permissao?: { acao: Action; recurso: Resource }

  // Providers obrigatórios
  getIdentity: IdentityResolver<Request>
  provider: PermissionsProvider

  // Auditoria (opcional)
  tabela?: string | ((params: TParams) => string)
  acao?: string
  audit?: AuditFunction
}

type Handler<TParams = {}> = (
  ctx: HandlerContext<TParams>
) => Promise<Response | HandlerResult>

interface HandlerContext<TParams = {}> {
  req: Request
  email: string
  userId?: string
  params: TParams
}
```

**Exemplo:**

```typescript
export const POST = withApi(
  async ({ req, email, userId }) => {
    const body = await req.json()
    const created = await createResource(body, userId)
    return Response.json(created, { status: 201 })
  },
  {
    provider,
    getIdentity,
    permissao: { acao: "Criar", recurso: "Recursos" },
    audit: auditLogger,
    tabela: "recursos",
    acao: "CREATE",
  }
)
```

### `withApiForId(handler, options)`

Wrapper para routes com parâmetros dinâmicos (`[id]`, `[slug]`, etc.).

```typescript
export const PUT = withApiForId(
  async ({ params, req, userId }) => {
    const body = await req.json()
    const antes = await getResource(params.id)
    const depois = await updateResource(params.id, body)

    return {
      response: Response.json(depois),
      audit: { antes, depois },
    }
  },
  {
    provider,
    getIdentity,
    permissao: { acao: "Editar", recurso: "Recursos" },
    tabela: (params) => `recursos_${params.category}`,
    audit: auditLogger,
  }
)
```

### Interface de Auditoria

```typescript
interface AuditArgs {
  tabela?: string
  acao?: string
  userId?: string
  email?: string
  antes?: object
  depois?: object
  contexto?: string
  req: Request
}

type AuditFunction = (args: AuditArgs) => Promise<void> | void
```

## 🧪 Exemplos Avançados

### Autorização Condicional

```typescript
export const GET = withApi(
  async ({ req, email, userId }) => {
    const url = new URL(req.url)
    const includePrivate = url.searchParams.get("private") === "true"

    if (includePrivate) {
      // Verificação adicional dentro do handler
      const canViewPrivate = await permissionsProvider
        .getPermissionsByIdentity(email)
        .then((perms) => pode(perms, "ExibirPrivado", "Relatorios"))

      if (!canViewPrivate) {
        return Response.json(
          { error: "Sem permissão para dados privados" },
          { status: 403 }
        )
      }
    }

    return Response.json(await getRelatorios({ includePrivate }))
  },
  {
    provider,
    getIdentity,
    permissao: { acao: "Exibir", recurso: "Relatorios" },
  }
)
```

### Auditoria Detalhada

```typescript
const auditLogger = async (args: AuditArgs) => {
  const userAgent = args.req.headers.get("user-agent")
  const ip = args.req.headers.get("x-forwarded-for") || "unknown"

  await prisma.auditLog.create({
    data: {
      ...args,
      metadata: {
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
        method: args.req.method,
        url: args.req.url,
      },
    },
  })

  // Log crítico para operações de exclusão
  if (args.acao === "DELETE") {
    await prisma.criticalAuditLog.create({
      data: {
        userId: args.userId,
        action: `${args.acao} em ${args.tabela}`,
        details: args.antes,
        timestamp: new Date(),
      },
    })
  }
}
```

### Rate Limiting Integrado

```typescript
const rateLimitedApi = withApi(
  async ({ email, req }) => {
    // Rate limiting por usuário
    const key = `api:${email}:${req.url}`
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, 60) // 1 minuto
    }

    if (current > 100) {
      // 100 requests/min
      return Response.json({ error: "Rate limit excedido" }, { status: 429 })
    }

    return Response.json({ data: "success" })
  },
  {
    provider,
    getIdentity,
    permissao: { acao: "Usar", recurso: "API" },
  }
)
```

### Middleware de Validação

```typescript
import { z } from "zod"

const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["public", "private"]),
})

export const POST = withApi(
  async ({ req, userId }) => {
    const body = await req.json()

    // Validação de schema
    const validatedData = createResourceSchema.parse(body)

    const resource = await createResource(validatedData, userId)
    return Response.json(resource, { status: 201 })
  },
  {
    provider,
    getIdentity,
    permissao: { acao: "Criar", recurso: "Recursos" },
    audit: auditLogger,
  }
)
```

## 🔧 Desenvolvimento

```bash
# Build
npm run build

# Type checking
npm run typecheck

# Testes
npm test
```

## 📚 Documentação Relacionada

- 📖 [Documentação Completa](../../docs/)
- 🏛️ [Arquitetura do Sistema](../../docs/architecture.md)
- 🔌 [Provider Contracts](../rbac-provider/)
- 💻 [Exemplos Next.js](../../examples/next-api/)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Autoridade Nacional de Proteção de Dados)

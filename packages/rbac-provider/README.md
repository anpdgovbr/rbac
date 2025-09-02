# @anpdgovbr/rbac-provider

[![npm version](https://img.shields.io/npm/v/@anpdgovbr/rbac-provider.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-provider)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Contratos e abstrações para providers de RBAC** — Interfaces padronizadas para resolução de identidade e permissões.

## ✨ Características

- 🔌 **Pluggable** — Interfaces padronizadas para diferentes fontes de dados
- ⚡ **Cache TTL** — Sistema de cache em memória com expiração configurável
- 🎯 **Type Safety** — Contratos rigorosos para implementações
- 🔄 **Invalidação** — Cache seletivo por identidade ou global
- 🚀 **Performance** — Otimizado para alta concorrência

## 📦 Instalação

```bash
npm install @anpdgovbr/rbac-provider@beta
```

## 🎯 Conceitos Principais

### Provider de Permissões

Interface padrão para resolução de permissões por identidade:

```typescript
interface PermissionsProvider {
  getPermissionsByIdentity(identity: string): Promise<PermissionsMap>
  invalidate(identity?: string): void
}
```

### Resolver de Identidade

Interface para extrair identidade de requests:

```typescript
interface IdentityResolver<Req = unknown> {
  resolve(req: Req): Promise<Identity>
}
```

## 🎯 Uso Básico

### Provider Customizado

```typescript
import { PermissionsProvider } from "@anpdgovbr/rbac-provider"
import { toPermissionsMap } from "@anpdgovbr/rbac-core"

class DatabasePermissionsProvider implements PermissionsProvider {
  constructor(private db: Database) {}

  async getPermissionsByIdentity(email: string): Promise<PermissionsMap> {
    const permissions = await this.db.getUserPermissions(email)
    return toPermissionsMap(permissions)
  }

  invalidate(email?: string): void {
    // Limpar cache específico se necessário
    if (email) {
      this.db.clearUserCache(email)
    } else {
      this.db.clearAllCache()
    }
  }
}
```

### Cache TTL Decorator

```typescript
import { withTTLCache } from "@anpdgovbr/rbac-provider"

const baseProvider = new DatabasePermissionsProvider(db)

// Adiciona cache de 5 minutos
const cachedProvider = withTTLCache(baseProvider, 5 * 60 * 1000)

// Uso normal - cache transparente
const permissions = await cachedProvider.getPermissionsByIdentity("user@gov.br")

// Invalidação seletiva
cachedProvider.invalidate("user@gov.br") // apenas este usuário
cachedProvider.invalidate() // todos os usuários
```

### Resolver de Identidade NextAuth

```typescript
import { IdentityResolver } from "@anpdgovbr/rbac-provider"
import { getServerSession } from "next-auth"

class NextAuthIdentityResolver implements IdentityResolver<Request> {
  async resolve(req: Request): Promise<Identity> {
    const session = await getServerSession()

    if (!session?.user?.email) {
      throw new Error("Usuário não autenticado")
    }

    return {
      id: session.user.id,
      email: session.user.email,
    }
  }
}
```

## 🔧 API Completa

### `PermissionsProvider`

Interface principal para providers de permissões.

```typescript
interface PermissionsProvider {
  /**
   * Resolve permissões para uma identidade específica
   * @param identity - Email ou ID do usuário
   * @returns Mapa de permissões resolvidas
   */
  getPermissionsByIdentity(identity: string): Promise<PermissionsMap>

  /**
   * Invalida cache de permissões
   * @param identity - Identidade específica (opcional)
   */
  invalidate(identity?: string): void
}
```

### `IdentityResolver<Req>`

Interface para resolução de identidade a partir de requests.

```typescript
interface Identity {
  id: string
  email?: string
}

interface IdentityResolver<Req = unknown> {
  /**
   * Extrai identidade do request
   * @param req - Request object (Request, NextRequest, etc.)
   * @returns Identidade resolvida
   * @throws Error se não autenticado
   */
  resolve(req: Req): Promise<Identity>
}
```

### `withTTLCache(provider, ttlMs)`

Decorator que adiciona cache TTL a qualquer provider.

**Parâmetros:**

- `provider: PermissionsProvider` — Provider base
- `ttlMs: number` — TTL em milissegundos

**Retorna:** `PermissionsProvider` — Provider com cache

```typescript
// Cache de 10 minutos
const cached = withTTLCache(baseProvider, 10 * 60 * 1000)
```

**Comportamento:**

- Cache por identidade individual
- Expiração automática após TTL
- Invalidação seletiva ou global
- Thread-safe para concorrência

## 🧪 Exemplos Avançados

### Provider com Fallback

```typescript
class FallbackPermissionsProvider implements PermissionsProvider {
  constructor(
    private primary: PermissionsProvider,
    private fallback: PermissionsProvider
  ) {}

  async getPermissionsByIdentity(identity: string): Promise<PermissionsMap> {
    try {
      return await this.primary.getPermissionsByIdentity(identity)
    } catch (error) {
      console.warn(`Primary provider failed, using fallback:`, error)
      return await this.fallback.getPermissionsByIdentity(identity)
    }
  }

  invalidate(identity?: string): void {
    this.primary.invalidate(identity)
    this.fallback.invalidate(identity)
  }
}
```

### Provider com Métricas

```typescript
class MetricsPermissionsProvider implements PermissionsProvider {
  constructor(
    private provider: PermissionsProvider,
    private metrics: MetricsCollector
  ) {}

  async getPermissionsByIdentity(identity: string): Promise<PermissionsMap> {
    const startTime = Date.now()

    try {
      const result = await this.provider.getPermissionsByIdentity(identity)

      this.metrics.recordDuration("rbac.provider.success", Date.now() - startTime)
      this.metrics.increment("rbac.provider.calls.success")

      return result
    } catch (error) {
      this.metrics.recordDuration("rbac.provider.error", Date.now() - startTime)
      this.metrics.increment("rbac.provider.calls.error")
      throw error
    }
  }

  invalidate(identity?: string): void {
    this.metrics.increment("rbac.provider.invalidations")
    this.provider.invalidate(identity)
  }
}
```

### Composição de Providers

```typescript
// Camada completa com cache, métricas e fallback
const composedProvider = withTTLCache(
  new MetricsPermissionsProvider(
    new FallbackPermissionsProvider(
      new PrismaPermissionsProvider(prisma),
      new StaticPermissionsProvider(defaultPermissions)
    ),
    metricsCollector
  ),
  5 * 60 * 1000 // 5 minutos de cache
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

- 📖 [Consolidação de Features e Roadmap](../../docs/README.md)
- 🔌 [Provider Prisma](../rbac-prisma/)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Autoridade Nacional de Proteção de Dados)

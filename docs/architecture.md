# 🏗️ Arquitetura RBAC ANPD — Sistema Modular de Autorização

[![Status](https://img.shields.io/badge/Status-Produção_Beta-orange.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-Modular_Monorepo-green.svg)]()

## 🎯 Visão Geral

O RBAC ANPD é um sistema de autorização por papéis (Role-Based Access Control) projetado para ser **modular**, **reutilizável** e **framework-agnostic**. A arquitetura permite integração incremental em sistemas existentes sem acoplamento forte.

### Objetivos Estratégicos

- 🎯 **Unificação**: Modelo consistente de permissões `{acao, recurso}` em todos os sistemas
- 🔄 **Reusabilidade**: Componentes reutilizáveis entre projetos Next.js, React e outros
- 🔒 **Consistência**: Eliminação de divergências entre autorizações de UI e servidor
- 🧩 **Modularidade**: Adapters opcionais sem acoplar o core
- 📈 **Escalabilidade**: Suporte a hierarquias complexas e alta concorrência

## 🏗️ Arquitetura do Monorepo

### Camadas Arquiteturais

```mermaid
graph TB
    subgraph "🎯 Aplicação"
        APP[Aplicações Next.js/React]
    end

    subgraph "🔌 Framework Adapters"
        NEXT[@anpdgovbr/rbac-next]
        REACT[@anpdgovbr/rbac-react]
        ADMIN[@anpdgovbr/rbac-admin]
    end

    subgraph "💾 Data Adapters"
        PRISMA[@anpdgovbr/rbac-prisma]
        CUSTOM[Custom Providers]
    end

    subgraph "⚡ Core Layer"
        PROVIDER[@anpdgovbr/rbac-provider]
        CORE[@anpdgovbr/rbac-core]
    end

    APP --> NEXT
    APP --> REACT
    APP --> ADMIN
    NEXT --> PROVIDER
    REACT --> CORE
    ADMIN --> CORE
    PRISMA --> PROVIDER
    CUSTOM --> PROVIDER
    PROVIDER --> CORE
```

### 📦 Packages e Responsabilidades

#### Core Layer (Base)

**`@anpdgovbr/rbac-core`** `v0.1.0-beta.3` ✅

- 🏷️ **Responsabilidade**: Tipos fundamentais e utilitários de baixo nível
- 🔧 **Funcionalidades**:
  - Tipos `Action`, `Resource`, `PermissionsMap`
  - Funções `pode()`, `hasAny()`, `toPermissionsMap()`
  - Conversores e validações
  - Proteção contra prototype pollution
- 🎯 **Zero dependências** — Framework agnostic

**`@anpdgovbr/rbac-provider`** `v0.1.0-beta.3` ✅

- 🏷️ **Responsabilidade**: Contratos e abstrações para providers
- 🔧 **Funcionalidades**:
  - Interface `PermissionsProvider`
  - Interface `IdentityResolver`
  - Sistema de cache TTL com `withTTLCache()`
  - Invalidação seletiva de cache
- 🎯 **Minimal dependencies** — Apenas depende do core

#### Data Adapters

**`@anpdgovbr/rbac-prisma`** `v0.1.0-beta.3` ✅

- 🏷️ **Responsabilidade**: Provider Prisma com herança de perfis
- 🔧 **Funcionalidades**:
  - Algoritmo BFS para hierarquia de perfis (DAG)
  - União por grant verdadeiro
  - Configuração flexível de schema
  - Queries otimizadas O(V+E)
- 🎯 **Produção Ready** — Usado em sistemas críticos

#### Framework Adapters

**`@anpdgovbr/rbac-next`** `v0.1.0-beta.3` 🚧

- 🏷️ **Responsabilidade**: Middleware para Next.js App Router
- 🔧 **Funcionalidades**:
  - `withApi()` e `withApiForId()` para proteção de rotas
  - Integração automática com audit logging
  - Context enrichment para handlers
  - Type safety para rotas dinâmicas
- 🎯 **Beta Ativo** — Refinando APIs públicas

**`@anpdgovbr/rbac-react`** `v0.2.0-beta.1` 🚧

- 🏷️ **Responsabilidade**: Hooks e HOCs para React
- 🔧 **Funcionalidades**:
  - `usePermissions()`, `usePode()` hooks
  - `withPermissao()` HOC para proteção de componentes
  - `PermissionsProvider` para hidratação
  - Integração com SWR para cache client-side
- 🎯 **React 19+ Required** — Breaking change recente

**`@anpdgovbr/rbac-admin`** `v0.2.0-beta.1` ⚠️

- 🏷️ **Responsabilidade**: Interface administrativa
- 🔧 **Funcionalidades** (em desenvolvimento):
  - CRUD de perfis e permissões
  - Editor visual de hierarquia
  - Gestão de usuários
  - Dashboard de analytics
- 🎯 **Work in Progress** — Interface básica funcional

## 🔄 Fluxos de Autorização

### Servidor (Autorização Forte)

```typescript
// Next.js API Route com proteção RBAC
export const GET = withApi(
  async (context) => {
    // context.userId, context.audit disponíveis
    const data = await getSecureData(context.userId)
    return NextResponse.json(data)
  },
  {
    provider: cachedPrismaProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Exibir", recurso: "Relatorios" },
    audit: auditLogger,
  }
)
```

**Fluxo de Execução:**

1. 🔐 **Autenticação**: Resolução de identidade via NextAuth/custom
2. 🔍 **Resolução**: Provider busca permissões (com cache TTL)
3. ✅ **Autorização**: Verificação `pode(permissoes, acao, recurso)`
4. 📝 **Auditoria**: Log automático de acesso/negação
5. 🎯 **Execução**: Handler executado com contexto enriquecido

### Cliente (UX Enhancement)

```tsx
// React Component com proteção UX
function Dashboard() {
  const { pode, loading } = usePode()

  if (loading) return <DashboardSkeleton />

  return (
    <div>
      {pode("Exibir", "Relatorios") && <RelatoriosSection />}
      {pode("Criar", "Relatorios") && <CreateButton />}
      {pode("Gerenciar", "Usuarios") && <AdminPanel />}
    </div>
  )
}

// HOC para proteção declarativa
const ProtectedAdmin = withPermissao(AdminInterface, "Acessar", "PainelAdmin")
```

**Fluxo de Execução:**

1. 🔄 **Hidratação**: Permissões vindas do servidor ou API
2. 🎨 **Renderização**: Componentes condicionais baseados em permissões
3. 📡 **SWR Cache**: Cache client-side com revalidação automática
4. 🔄 **Sincronização**: Atualizações em tempo real entre tabs

## 🏛️ Princípios Arquiteturais

### 1. Opt-in e Independência

- **Core Desacoplado**: `Action`/`Resource` são `string` genéricas
- **Adapters Opcionais**: Cada framework é um package separado
- **Providers Injetáveis**: Sem dependência fixa de NextAuth ou Prisma
- **Zero Lock-in**: Fácil migração entre providers

### 2. Performance e Escalabilidade

```typescript
// Cache TTL otimizado
const cachedProvider = withTTLCache(
  prismaProvider,
  60_000, // 1 minuto TTL
  {
    metrics: metricsCollector,
    invalidateOn: ["role-change", "permission-update"],
  }
)
```

- **O(1) Lookups**: `PermissionsMap` permite consultas instantâneas
- **Cache TTL**: Reduz carga no banco sem comprometer consistência
- **Hierarchical Queries**: Algoritmo BFS otimizado para DAGs
- **Memory Efficient**: Estruturas de dados compactas

### 3. Type Safety e Developer Experience

```typescript
// Type-safe APIs com IntelliSense completo
export const GET = withApiForId<number>(
  async (context) => {
    // context.id é garantidamente number
    const user = await getUserById(context.id)
    return NextResponse.json(user)
  },
  {
    extractId: (req) => parseInt(getLastPathSegment(req.url)),
    permissao: { acao: "Exibir", recurso: "Usuario" },
  }
)
```

- **TypeScript Native**: APIs fully typed with generics
- **IntelliSense Support**: IDE autocomplete para todas as APIs
- **Compile-time Safety**: Erros detectados em build time
- **Generic Flexibility**: Suporte a tipos customizados

## 🚀 Casos de Uso Avançados

### Hierarquias Complexas

```sql
-- Schema suportado: hierarquias DAG
Perfil: Admin -> Moderador -> Usuario
              -> Editor -----> Usuario
```

**Algoritmo de Resolução:**

1. **BFS Traversal**: Busca em largura na hierarquia
2. **União por Grant**: `true` overrides `false` sempre
3. **Cycle Detection**: Prevenção automática de loops
4. **Active Only**: Apenas perfis ativos são considerados

### Audit Trail Avançado

```typescript
const auditLogger = async (auditData) => {
  await auditService.record({
    timestamp: auditData.timestamp,
    userId: auditData.userId,
    action: auditData.action,
    resource: auditData.resource,
    allowed: true,
    ip: auditData.clientIp,
    userAgent: auditData.userAgent,
    context: auditData.entityId,

    // Metadados customizados
    request_path: auditData.req.url,
    session_id: getSessionId(auditData.req),
    correlation_id: generateCorrelationId(),
  })
}
```

### Multi-tenant Support

```typescript
// Provider com isolamento de tenant
const tenantProvider = createPrismaPermissionsProvider({
  prisma,
  identityField: "email",
  // Filtro automático por tenant
  whereClause: (identity) => ({
    tenant_id: getTenantFromIdentity(identity),
  }),
})
```

---

## 🔄 Evolução e Migração

### Estratégia de Migração

1. **Fase 1**: Implementação incremental no core
2. **Fase 2**: Migração de rotas críticas
3. **Fase 3**: Refactoring completo de UI
4. **Fase 4**: Deprecação de sistema legado

### Backward Compatibility

- **FlatKey Support**: Compatibilidade com formato legado
- **Gradual Migration**: Convivência com sistema antigo
- **Feature Flags**: Ativação controlada de funcionalidades

---

**Status**: Produção Beta | **Última Atualização**: Setembro 2025  
**Desenvolvido por**: Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)

# 🏛️ Arquitetura RBAC ANPD

Nota: Esta visão geral permanece válida; para status de features concluídas e backlog por pacote, consulte também `docs/README.md` (consolidação de DONE/TODO).

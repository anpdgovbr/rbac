# 🔌 APIs RBAC ANPD — Referência Completa

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)]()
[![API Status](https://img.shields.io/badge/API-Stable_Beta-orange.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-85%25+-green.svg)]()

## 📋 Índice de APIs

- [🎯 Core API](#-core-api) — Tipos fundamentais e utilitários
- [🔌 Provider API](#-provider-api) — Abstrações e contratos
- [💾 Prisma API](#-prisma-api) — Provider para Prisma ORM
- [🌐 Next.js API](#-nextjs-api) — Middleware e proteção de rotas
- [⚛️ React API](#️-react-api) — Hooks e componentes
- [🛡️ Admin API](#️-admin-api) — Interface administrativa

---

## 🎯 Core API

**Package**: `@anpdgovbr/rbac-core@0.1.0-beta.3`

### Tipos Fundamentais

```typescript
// Tipos base do sistema
type Action = string
type Resource = string
type Grant = boolean

// Estrutura de permissão
interface Permissao {
  acao: Action
  recurso: Resource
}

// Mapa otimizado para consultas O(1)
interface PermissionsMap {
  [flatKey: string]: Grant
}
```

### `pode(permissoes, acao, recurso): boolean`

Função principal de verificação de permissões.

```typescript
import { pode } from '@anpdgovbr/rbac-core'

// Verificação simples
const canView = pode(userPermissions, "Exibir", "Relatorios")

// Verificação com fallback
const canEdit = pode(userPermissions, "Editar", "Usuario") || 
                pode(userPermissions, "Administrar", "Usuarios")

// Uso em guards
if (!pode(permissions, "Criar", "Processo")) {
  throw new ForbiddenError("Sem permissão para criar processos")
}
```

**Parâmetros:**
- `permissoes: PermissionsMap` — Mapa de permissões do usuário
- `acao: Action` — Ação a ser verificada
- `recurso: Resource` — Recurso alvo
- **Retorna**: `boolean` — `true` se permitido

### `hasAny(permissoes, permissoesRequeridas): boolean`

Verifica se o usuário possui qualquer uma das permissões especificadas.

```typescript
import { hasAny } from '@anpdgovbr/rbac-core'

// Verificação múltipla (OR lógico)
const canAccess = hasAny(userPermissions, [
  { acao: "Exibir", recurso: "Dashboard" },
  { acao: "Acessar", recurso: "PainelAdmin" },
  { acao: "Visualizar", recurso: "Metricas" }
])

// Guard flexível
if (!hasAny(permissions, requiredPermissions)) {
  return <AccessDenied />
}
```

**Parâmetros:**
- `permissoes: PermissionsMap` — Mapa de permissões
- `permissoesRequeridas: Permissao[]` — Array de permissões (OR)
- **Retorna**: `boolean` — `true` se possui qualquer uma

### `toPermissionsMap(permissoes): PermissionsMap`

Converte array de permissões para mapa otimizado.

```typescript
import { toPermissionsMap } from '@anpdgovbr/rbac-core'

// Conversão de lista para mapa
const rawPermissions = [
  { acao: "Exibir", recurso: "Relatorios", grant: true },
  { acao: "Criar", recurso: "Usuario", grant: false },
  { acao: "Editar", recurso: "Usuario", grant: true }
]

const permissionsMap = toPermissionsMap(rawPermissions)
// Resultado: { "Exibir:Relatorios": true, "Editar:Usuario": true }
```

### `flatKey(acao, recurso): string`

Gera chave única para indexação.

```typescript
import { flatKey } from '@anpdgovbr/rbac-core'

const key = flatKey("Exibir", "Relatorios") // "Exibir:Relatorios"
```

---

## 🔌 Provider API

**Package**: `@anpdgovbr/rbac-provider@0.1.0-beta.3`

### Interface `PermissionsProvider`

Contrato principal para provedores de permissões.

```typescript
interface PermissionsProvider {
  getUserPermissions(identity: string): Promise<PermissionsMap>
}

// Implementação custom
class CustomPermissionsProvider implements PermissionsProvider {
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    const user = await this.userService.findByEmail(identity)
    const roles = await this.roleService.getUserRoles(user.id)
    
    return this.buildPermissionsMap(roles)
  }
}
```

### Interface `IdentityResolver`

Extração de identidade de contextos de framework.

```typescript
interface IdentityResolver<TRequest = unknown> {
  getIdentity(req: TRequest): Promise<string | null>
}

// Resolver NextAuth
const nextAuthResolver: IdentityResolver<NextRequest> = {
  async getIdentity(req) {
    const session = await getServerSession(req)
    return session?.user?.email || null
  }
}

// Resolver custom JWT
const jwtResolver: IdentityResolver<NextRequest> = {
  async getIdentity(req) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return null
    
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.sub
  }
}
```

### `withTTLCache(provider, ttlMs, options?): PermissionsProvider`

Decorator de cache com TTL configurável.

```typescript
import { withTTLCache } from '@anpdgovbr/rbac-provider'

// Cache básico
const cachedProvider = withTTLCache(
  prismaProvider,
  60_000 // 1 minuto
)

// Cache avançado com métricas
const advancedCachedProvider = withTTLCache(
  prismaProvider,
  300_000, // 5 minutos
  {
    metrics: {
      onHit: (identity) => metrics.increment('rbac.cache.hit'),
      onMiss: (identity) => metrics.increment('rbac.cache.miss')
    },
    invalidateOn: ['role-updated', 'permission-changed'],
    maxSize: 1000 // Limite de entradas em cache
  }
)

// Invalidação manual
await cachedProvider.invalidate('user@example.com')
await cachedProvider.invalidateAll()
```

---

## 💾 Prisma API

**Package**: `@anpdgovbr/rbac-prisma@0.1.0-beta.3`

### `createPrismaPermissionsProvider(config): PermissionsProvider`

Cria provider Prisma com hierarquia de perfis.

```typescript
import { createPrismaPermissionsProvider } from '@anpdgovbr/rbac-prisma'

// Configuração básica
const provider = createPrismaPermissionsProvider({
  prisma: prismaClient,
  identityField: "email"
})

// Configuração avançada
const advancedProvider = createPrismaPermissionsProvider({
  prisma: prismaClient,
  identityField: "email",
  
  // Schema customizado
  schema: {
    userTable: "Usuario",
    roleTable: "Perfil", 
    permissionTable: "Permissao",
    userRoleTable: "UsuarioPerfil",
    rolePermissionTable: "PerfilPermissao",
    roleHierarchyTable: "PerfilHierarquia"
  },
  
  // Filtros adicionais
  whereClause: (identity) => ({
    ativo: true,
    tenant_id: getTenantFromEmail(identity)
  }),
  
  // Configuração de hierarquia
  hierarchy: {
    enableInheritance: true,
    maxDepth: 10,
    strategy: "union" // ou "override"
  }
})
```

### Algoritmo de Herança

```typescript
// Herança automática com algoritmo BFS
// Schema exemplo:
// Admin -> Moderador -> Usuario
//       -> Editor -----> Usuario

const permissions = await provider.getUserPermissions("admin@anpd.gov.br")
// Retorna união de todas as permissões da hierarquia
// Grant verdadeiro sempre prevalece sobre falso
```

**Características:**
- ✅ **BFS Traversal**: Busca em largura para hierarquias DAG
- ✅ **Union Strategy**: `true` grants override `false` grants
- ✅ **Cycle Detection**: Prevenção automática de loops infinitos
- ✅ **Active Only**: Apenas perfis ativos são considerados
- ✅ **Performance**: Queries otimizadas O(V+E)

---

## 🌐 Next.js API

**Package**: `@anpdgovbr/rbac-next@0.1.0-beta.3`

### `withApi(handler, config): RouteHandler`

Protege rotas de API com verificação de permissões.

```typescript
import { withApi } from '@anpdgovbr/rbac-next'
import { NextResponse } from 'next/server'

// Proteção básica
export const GET = withApi(
  async (context) => {
    // context.userId, context.audit disponíveis
    const data = await getReports(context.userId)
    return NextResponse.json(data)
  },
  {
    provider: cachedPrismaProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Exibir", recurso: "Relatorios" }
  }
)

// Proteção com auditoria
export const POST = withApi(
  async (context) => {
    const body = await context.req.json()
    const result = await createUser(body)
    
    // Auditoria automática registrada
    return NextResponse.json(result, { status: 201 })
  },
  {
    provider: cachedPrismaProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Criar", recurso: "Usuario" },
    audit: auditLogger
  }
)
```

### `withApiForId<T>(handler, config): RouteHandler`

Proteção de rotas dinâmicas com extração de ID tipada.

```typescript
import { withApiForId } from '@anpdgovbr/rbac-next'

// Rota dinâmica: /api/users/[id]
export const GET = withApiForId<number>(
  async (context) => {
    // context.id é garantidamente number
    const user = await getUserById(context.id)
    return NextResponse.json(user)
  },
  {
    extractId: (req) => {
      const url = new URL(req.url)
      const id = url.pathname.split('/').pop()
      return parseInt(id || '0')
    },
    provider: cachedProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Exibir", recurso: "Usuario" }
  }
)

// Rota UUID: /api/processos/[uuid]
export const PUT = withApiForId<string>(
  async (context) => {
    // context.id é string UUID
    const body = await context.req.json()
    const updated = await updateProcesso(context.id, body)
    return NextResponse.json(updated)
  },
  {
    extractId: (req) => getLastPathSegment(req.url),
    provider: cachedProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Editar", recurso: "Processo" }
  }
)
```

### Middleware de Autenticação

```typescript
// middleware.ts
import { withMiddleware } from '@anpdgovbr/rbac-next'

export default withMiddleware({
  provider: cachedProvider,
  getIdentity: nextAuthResolver,
  
  // Rotas protegidas com suas permissões
  protectedRoutes: [
    {
      pattern: /^\/admin/,
      permissao: { acao: "Acessar", recurso: "PainelAdmin" }
    },
    {
      pattern: /^\/relatorios/,
      permissao: { acao: "Exibir", recurso: "Relatorios" }
    }
  ],
  
  // Rotas públicas (bypass)
  publicRoutes: ['/login', '/api/health', '/api/public/*'],
  
  // Redirecionamento em caso de negação
  onUnauthorized: (req) => {
    return NextResponse.redirect('/access-denied')
  }
})
```

---

## ⚛️ React API

**Package**: `@anpdgovbr/rbac-react@0.2.0-beta.1` (React 19+ Required)

### Hook `usePermissions()`

Acesso direto às permissões do usuário.

```typescript
import { usePermissions } from '@anpdgovbr/rbac-react'

function Dashboard() {
  const { permissions, loading, error, mutate } = usePermissions()
  
  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorBoundary error={error} />
  
  return (
    <div>
      {pode(permissions, "Exibir", "Relatorios") && (
        <RelatoriosWidget />
      )}
      {pode(permissions, "Gerenciar", "Usuarios") && (
        <AdminPanel />
      )}
    </div>
  )
}
```

### Hook `usePode()`

Função de verificação otimizada.

```typescript
import { usePode } from '@anpdgovbr/rbac-react'

function UserActions({ userId }: { userId: string }) {
  const { pode, loading } = usePode()
  
  const canEdit = pode("Editar", "Usuario")
  const canDelete = pode("Excluir", "Usuario")
  const canView = pode("Exibir", "Usuario")
  
  if (loading) return <ActionsLoadingSkeleton />
  
  return (
    <div>
      {canView && <ViewButton userId={userId} />}
      {canEdit && <EditButton userId={userId} />}
      {canDelete && <DeleteButton userId={userId} />}
    </div>
  )
}
```

### HOC `withPermissao()`

Proteção declarativa de componentes.

```typescript
import { withPermissao } from '@anpdgovbr/rbac-react'

// Componente protegido
const AdminInterface = () => (
  <div>
    <h1>Painel Administrativo</h1>
    <UserManagement />
    <SystemSettings />
  </div>
)

// Proteção automática
const ProtectedAdminInterface = withPermissao(
  AdminInterface,
  "Acessar",
  "PainelAdmin",
  {
    fallback: <AccessDeniedMessage />,
    loading: <LoadingSpinner />
  }
)

// Uso
function App() {
  return (
    <Routes>
      <Route path="/admin" element={<ProtectedAdminInterface />} />
    </Routes>
  )
}
```

### Provider `PermissionsProvider`

Configuração e hidratação de permissões.

```typescript
import { PermissionsProvider } from '@anpdgovbr/rbac-react'

// Configuração da aplicação
function App() {
  return (
    <PermissionsProvider
      // Hidratação via API
      fetcher={async () => {
        const response = await fetch('/api/me/permissions')
        return response.json()
      }}
      
      // Configuração SWR
      swrConfig={{
        refreshInterval: 300_000, // 5 minutos
        revalidateOnFocus: true,
        revalidateOnReconnect: true
      }}
      
      // Estados customizados
      loadingComponent={<AppLoadingSkeleton />}
      errorComponent={({ error, retry }) => (
        <ErrorScreen error={error} onRetry={retry} />
      )}
    >
      <Router>
        <Routes>
          {/* Suas rotas aqui */}
        </Routes>
      </Router>
    </PermissionsProvider>
  )
}
```

### Integração com Next.js

```typescript
// pages/_app.tsx ou app/layout.tsx
import { PermissionsProvider } from '@anpdgovbr/rbac-react'

// Server-side hydration
export default function RootLayout({
  children,
  permissions // Vindas do servidor
}: {
  children: React.ReactNode
  permissions?: PermissionsMap
}) {
  return (
    <html>
      <body>
        <PermissionsProvider
          initialData={permissions} // Hidratação SSR
          fetcher={async () => {
            const res = await fetch('/api/me/permissions')
            return res.json()
          }}
        >
          {children}
        </PermissionsProvider>
      </body>
    </html>
  )
}
```

---

## 🛡️ Admin API

**Package**: `@anpdgovbr/rbac-admin@0.2.0-beta.1` (React 19+ Required)

⚠️ **Status**: Work in Progress — Interface básica funcional

### Componentes Principais

```typescript
import { 
  RoleManager,
  PermissionEditor,
  UserRoleAssignment,
  HierarchyVisualizer
} from '@anpdgovbr/rbac-admin'

// Interface administrativa completa
function AdminDashboard() {
  return (
    <div>
      {/* Gestão de perfis */}
      <RoleManager
        provider={prismaProvider}
        onRoleCreated={handleRoleCreated}
        onRoleUpdated={handleRoleUpdated}
      />
      
      {/* Editor de permissões */}
      <PermissionEditor
        roleId={selectedRoleId}
        provider={prismaProvider}
        availableActions={["Criar", "Exibir", "Editar", "Excluir"]}
        availableResources={["Usuario", "Processo", "Relatorio"]}
      />
      
      {/* Atribuição de perfis */}
      <UserRoleAssignment
        userId={selectedUserId}
        provider={prismaProvider}
        onAssignmentChanged={handleAssignmentChanged}
      />
      
      {/* Visualizador de hierarquia */}
      <HierarchyVisualizer
        provider={prismaProvider}
        editable={true}
        onHierarchyChanged={handleHierarchyChanged}
      />
    </div>
  )
}
```

### APIs de Administração

```typescript
// Gestão de perfis
const roleAPI = {
  async createRole(data: CreateRoleData) {
    // Criação de novo perfil
  },
  
  async updateRole(id: string, data: UpdateRoleData) {
    // Atualização de perfil
  },
  
  async deleteRole(id: string) {
    // Exclusão com verificação de dependências
  },
  
  async getRoleHierarchy() {
    // Recuperação da árvore de hierarquia
  }
}

// Gestão de permissões
const permissionAPI = {
  async setRolePermissions(roleId: string, permissions: Permissao[]) {
    // Definição de permissões do perfil
  },
  
  async getRolePermissions(roleId: string) {
    // Recuperação de permissões
  },
  
  async calculateEffectivePermissions(userId: string) {
    // Cálculo das permissões efetivas (com herança)
  }
}
```

---

## 🔧 Utilitários e Helpers

### Debugging e Desenvolvimento

```typescript
import { debugPermissions, validatePermissionsMap } from '@anpdgovbr/rbac-core'

// Debug de permissões
debugPermissions(userPermissions, {
  showInherited: true,
  showDenied: true,
  groupByResource: true
})

// Validação de estrutura
const validation = validatePermissionsMap(permissions)
if (!validation.valid) {
  console.error('Permissões inválidas:', validation.errors)
}
```

### Performance Monitoring

```typescript
import { withMetrics } from '@anpdgovbr/rbac-provider'

const monitoredProvider = withMetrics(cachedProvider, {
  onPermissionCheck: (identity, action, resource, result, duration) => {
    metrics.histogram('rbac.check.duration', duration)
    metrics.increment(`rbac.check.result.${result}`)
  },
  onCacheHit: (identity) => {
    metrics.increment('rbac.cache.hit')
  }
})
```

---

## 📚 Exemplos de Integração

### Sistema Legado

```typescript
// Migração gradual de sistema existente
const legacyCompatProvider = createLegacyWrapper({
  existingAuthSystem: legacyAuth,
  mappingRules: {
    "ADMIN": [{ acao: "Administrar", recurso: "*" }],
    "USER": [{ acao: "Exibir", recurso: "Dashboard" }]
  }
})
```

### Multi-tenant

```typescript
// Suporte a múltiplos tenants
const tenantProvider = createTenantAwareProvider({
  baseProvider: prismaProvider,
  tenantResolver: (identity) => extractTenantFromEmail(identity),
  isolation: "strict" // ou "shared"
})
```

---

**Status**: Beta Ativo | **Última Atualização**: Setembro 2025  
**Documentação**: [docs/README.md](./README.md) | **Suporte**: DDSS/CGTI/ANPD

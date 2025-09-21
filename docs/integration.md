# 🔗 Guia de Integração RBAC ANPD

[![Status](https://img.shields.io/badge/Status-Produção_Beta-orange.svg)]()
[![Integração](https://img.shields.io/badge/Integração-Multi_Framework-green.svg)]()
[![Compatibilidade](https://img.shields.io/badge/Compatibilidade-Next.js_15+-blue.svg)]()

## 📋 Índice de Integrações

- [🚀 Quick Start](#-quick-start)
- [🌐 Next.js 15+ App Router](#-nextjs-15-app-router)
- [⚛️ React 19+](#️-react-19)
- [💾 Prisma ORM](#-prisma-orm)
- [🔐 NextAuth.js](#-nextauthjs)
- [🎨 Material-UI (MUI)](#-material-ui-mui)
- [🧪 Testing](#-testing)
- [📊 Monitoring](#-monitoring)

---

## 🚀 Quick Start

### Instalação Mínima (Core Only)

```bash
# Para projetos que só precisam da lógica de verificação
npm install @anpdgovbr/rbac-core
```

```typescript
import { pode, toPermissionsMap } from "@anpdgovbr/rbac-core"

// Verificação simples
const userPermissions = toPermissionsMap([
  { acao: "Exibir", recurso: "Dashboard", permitido: true },
  { acao: "Criar", recurso: "Usuario", permitido: false },
])

const canView = pode(userPermissions, "Exibir", "Dashboard") // true
const canCreate = pode(userPermissions, "Criar", "Usuario") // false
```

### Stack Completa (Next.js + Prisma + React)

```bash
# Instalação completa para projetos Next.js
npm install @anpdgovbr/rbac-core @anpdgovbr/rbac-provider @anpdgovbr/rbac-prisma @anpdgovbr/rbac-next @anpdgovbr/rbac-react
```

---

## 🌐 Next.js 15+ App Router

### 1. Configuração do Provider

```typescript
// lib/rbac-config.ts
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { withTTLCache } from "@anpdgovbr/rbac-provider"
import { prisma } from "@/lib/prisma"

export const prismaProvider = createPrismaPermissionsProvider({
  prisma,
  identityField: "email",
})

// Cache de 5 minutos para produção
export const cachedProvider = withTTLCache(prismaProvider, 300_000)
```

### 2. Identity Resolver NextAuth

```typescript
// lib/identity-resolver.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { IdentityResolver } from "@anpdgovbr/rbac-provider"
import type { NextRequest } from "next/server"

export const nextAuthResolver: IdentityResolver<NextRequest> = {
  async resolve() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Não autenticado")
    return { id: session.user.id, email: session.user.email }
  },
}
```

### 3. Proteção de API Routes

```typescript
// app/api/users/route.ts
import { withApi } from "@anpdgovbr/rbac-next"
import { NextResponse } from "next/server"
import { cachedProvider } from "@/lib/rbac-config"
import { nextAuthResolver } from "@/lib/identity-resolver"

export const GET = withApi(
  async (context) => {
    // context.userId disponível
    const users = await getUsers()
    return NextResponse.json(users)
  },
  {
    provider: cachedProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Exibir", recurso: "Usuarios" },
  }
)

export const POST = withApi(
  async (context) => {
    const body = await context.req.json()
    const newUser = await createUser(body)
    return NextResponse.json(newUser, { status: 201 })
  },
  {
    provider: cachedProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Criar", recurso: "Usuario" },
  }
)
```

### 4. Rotas Dinâmicas

```typescript
// app/api/users/[id]/route.ts
import { withApiForId } from "@anpdgovbr/rbac-next"

export const GET = withApiForId<{ id: string }>(
  async (context) => {
    const user = await getUserById(context.params.id)
    return NextResponse.json(user)
  },
  {
    provider: cachedProvider,
    getIdentity: nextAuthResolver,
    permissao: { acao: "Exibir", recurso: "Usuario" },
  }
)
```

### 5. Proteção de página (server-side)

Use `checkPermission` e trate `UnauthenticatedError` / `ForbiddenError` com redirects:

```tsx
import { redirect } from "next/navigation"
import {
  checkPermission,
  UnauthenticatedError,
  ForbiddenError,
} from "@anpdgovbr/rbac-next"
import { nextAuthResolver, cachedProvider } from "@/rbac/server"

export default async function Page() {
  try {
    await checkPermission({
      getIdentity: nextAuthResolver,
      provider: cachedProvider,
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    })
  } catch (err) {
    if (err instanceof UnauthenticatedError) return redirect("/login")
    if (err instanceof ForbiddenError) return redirect("/acesso-negado")
    throw err
  }
  const ClientShell = (await import("./ClientShell")).default
  return <ClientShell />
}
```

---

## ⚛️ React 19+

### 1. Provider Setup

```typescript
// app/providers.tsx
import { PermissionsProvider } from '@anpdgovbr/rbac-react'
import type { PermissionsMap } from '@anpdgovbr/rbac-core'

interface ProvidersProps {
  children: React.ReactNode
  initialPermissions?: PermissionsMap
}

export default function Providers({ children, initialPermissions }: ProvidersProps) {
  return (
    <PermissionsProvider
      initialData={initialPermissions}
      fetcher={async () => {
        const response = await fetch('/api/me/permissions')
        if (!response.ok) throw new Error('Failed to fetch permissions')
        return response.json()
      }}
      swrConfig={{
        refreshInterval: 300_000, // 5 minutos
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        errorRetryCount: 3
      }}
    >
      {children}
    </PermissionsProvider>
  )
}
```

### 2. Layout Root

```typescript
// app/layout.tsx
import Providers from './providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cachedProvider } from '@/lib/rbac-config'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side permissions hydration
  const session = await getServerSession(authOptions)
  const initialPermissions = session?.user?.email
    ? await cachedProvider.getUserPermissions(session.user.email)
    : undefined

  return (
    <html lang="pt-BR">
      <body>
        <Providers initialPermissions={initialPermissions}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 3. Hooks Usage

```typescript
// components/dashboard.tsx
import { usePode, usePermissions } from '@anpdgovbr/rbac-react'
import { hasAny } from '@anpdgovbr/rbac-core'

export default function Dashboard() {
  const { pode, loading } = usePode()
  const { permissions, error, mutate } = usePermissions()

  // Loading state
  if (loading) return <DashboardSkeleton />

  // Error state
  if (error) return <ErrorDisplay error={error} onRetry={() => mutate()} />

  // Multiple permissions check
  const canAccessAnyAdmin = hasAny(permissions, [
    { acao: "Acessar", recurso: "PainelAdmin" },
    { acao: "Gerenciar", recurso: "Usuarios" },
    { acao: "Administrar", recurso: "Sistema" }
  ])

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {pode("Exibir", "Relatorios") && (
        <section>
          <h2>Relatórios</h2>
          <RelatoriosList />
        </section>
      )}

      {pode("Criar", "Usuario") && (
        <section>
          <h2>Criar Usuário</h2>
          <CreateUserForm />
        </section>
      )}

      {canAccessAnyAdmin && (
        <section>
          <h2>Administração</h2>
          <AdminPanel />
        </section>
      )}
    </div>
  )
}
```

### 4. HOC Protection

```typescript
// components/protected-admin.tsx
import { withPermissao } from '@anpdgovbr/rbac-react'
import AdminInterface from './admin-interface'
import AccessDenied from './access-denied'
import LoadingSpinner from './loading-spinner'

const ProtectedAdminInterface = withPermissao(
  AdminInterface,
  "Acessar",
  "PainelAdmin",
  {
    fallback: <AccessDenied />,
    loading: <LoadingSpinner />
  }
)

export default ProtectedAdminInterface
```

### 5. Conditional Rendering Patterns

```typescript
// components/user-actions.tsx
import { usePode } from '@anpdgovbr/rbac-react'
import Button from '@mui/material/Button'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

interface UserActionsProps {
  userId: string
  onEdit?: () => void
  onDelete?: () => void
}

export default function UserActions({ userId, onEdit, onDelete }: UserActionsProps) {
  const { pode } = usePode()

  const canEdit = pode("Editar", "Usuario")
  const canDelete = pode("Excluir", "Usuario")

  // No actions available
  if (!canEdit && !canDelete) return null

  return (
    <div className="user-actions">
      {canEdit && (
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Editar
        </Button>
      )}

      {canDelete && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >
          Excluir
        </Button>
      )}
    </div>
  )
}
```

---

## 💾 Prisma ORM

### 1. Schema Definition

```prisma
// prisma/schema.prisma
model Usuario {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relação com perfis
  usuarioPerfis UsuarioPerfil[]

  @@map("usuarios")
}

model Perfil {
  id        String   @id @default(cuid())
  nome      String   @unique
  descricao String?
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  usuarioPerfis    UsuarioPerfil[]
  perfilPermissoes PerfilPermissao[]

  // Hierarquia (self-referencing)
  perfilPai     Perfil?          @relation("PerfilHierarquia", fields: [perfilPaiId], references: [id])
  perfilPaiId   String?
  perfisFilhos  Perfil[]         @relation("PerfilHierarquia")

  @@map("perfis")
}

model Permissao {
  id       String @id @default(cuid())
  acao     String
  recurso  String

  // Relações
  perfilPermissoes PerfilPermissao[]

  @@unique([acao, recurso])
  @@map("permissoes")
}

model UsuarioPerfil {
  id       String @id @default(cuid())

  usuario   Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  usuarioId String

  perfil   Perfil @relation(fields: [perfilId], references: [id], onDelete: Cascade)
  perfilId String

  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([usuarioId, perfilId])
  @@map("usuario_perfis")
}

model PerfilPermissao {
  id       String @id @default(cuid())

  perfil      Perfil     @relation(fields: [perfilId], references: [id], onDelete: Cascade)
  perfilId    String

  permissao   Permissao  @relation(fields: [permissaoId], references: [id], onDelete: Cascade)
  permissaoId String

  grant     Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([perfilId, permissaoId])
  @@map("perfil_permissoes")
}
```

### 2. Provider Configuration

```typescript
// lib/rbac-prisma.ts
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { prisma } from "@/lib/prisma"

export const prismaProvider = createPrismaPermissionsProvider({
  prisma,
  identityField: "email",

  // Configuração de schema (opcional se seguir convenções)
  schema: {
    userTable: "Usuario",
    roleTable: "Perfil",
    permissionTable: "Permissao",
    userRoleTable: "UsuarioPerfil",
    rolePermissionTable: "PerfilPermissao",
  },

  // Configuração de hierarquia
  hierarchy: {
    enableInheritance: true,
    maxDepth: 10,
    strategy: "union", // true grants override false grants
  },

  // Filtros adicionais
  whereClause: (identity) => ({
    ativo: true,
  }),
})
```

### 3. Seeds

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Criação de permissões básicas
  const permissions = await Promise.all([
    prisma.permissao.upsert({
      where: { acao_recurso: { acao: "Exibir", recurso: "Dashboard" } },
      update: {},
      create: { acao: "Exibir", recurso: "Dashboard" },
    }),
    prisma.permissao.upsert({
      where: { acao_recurso: { acao: "Criar", recurso: "Usuario" } },
      update: {},
      create: { acao: "Criar", recurso: "Usuario" },
    }),
    prisma.permissao.upsert({
      where: { acao_recurso: { acao: "Administrar", recurso: "Sistema" } },
      update: {},
      create: { acao: "Administrar", recurso: "Sistema" },
    }),
  ])

  // Criação de perfis
  const adminProfile = await prisma.perfil.upsert({
    where: { nome: "Administrador" },
    update: {},
    create: {
      nome: "Administrador",
      descricao: "Acesso total ao sistema",
    },
  })

  const userProfile = await prisma.perfil.upsert({
    where: { nome: "Usuario" },
    update: {},
    create: {
      nome: "Usuario",
      descricao: "Acesso básico",
      perfilPaiId: adminProfile.id, // Hierarquia
    },
  })

  // Atribuição de permissões
  await Promise.all([
    // Admin tem todas as permissões
    ...permissions.map((permission) =>
      prisma.perfilPermissao.upsert({
        where: {
          perfilId_permissaoId: {
            perfilId: adminProfile.id,
            permissaoId: permission.id,
          },
        },
        update: {},
        create: {
          perfilId: adminProfile.id,
          permissaoId: permission.id,
          grant: true,
        },
      })
    ),

    // Usuario só pode ver dashboard
    prisma.perfilPermissao.upsert({
      where: {
        perfilId_permissaoId: {
          perfilId: userProfile.id,
          permissaoId: permissions.find(
            (p) => p.acao === "Exibir" && p.recurso === "Dashboard"
          )!.id,
        },
      },
      update: {},
      create: {
        perfilId: userProfile.id,
        permissaoId: permissions.find(
          (p) => p.acao === "Exibir" && p.recurso === "Dashboard"
        )!.id,
        grant: true,
      },
    }),
  ])

  console.log("Seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 4. Migrations

```bash
# Gerar migration
npx prisma migrate dev --name add_rbac_schema

# Reset development database
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy
```

---

## 🔐 NextAuth.js

### 1. Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      // Adicionar informações de permissões à sessão
      if (session.user?.email) {
        try {
          const permissions = await cachedProvider.getUserPermissions(session.user.email)
          session.user.permissions = permissions
        } catch (error) {
          console.error("Failed to load permissions:", error)
          session.user.permissions = {}
        }
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Verificar se usuário tem acesso ao sistema
      if (user.email) {
        const hasAccess = await checkUserAccess(user.email)
        return hasAccess
      }

      return false
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

async function checkUserAccess(email: string): Promise<boolean> {
  try {
    const permissions = await cachedProvider.getUserPermissions(email)
    // Verificar se tem pelo menos permissão básica
    return Object.keys(permissions).length > 0
  } catch {
    return false
  }
}
```

### 2. API Endpoint

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### 3. Session Types

```typescript
// types/next-auth.d.ts
import { PermissionsMap } from "@anpdgovbr/rbac-core"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      permissions?: PermissionsMap
    }
  }
}
```

### 4. Client Components

```typescript
// components/auth-button.tsx
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import Button from '@mui/material/Button'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <p>Loading...</p>

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
    )
  }

  return (
    <div>
      <p>Not signed in</p>
      <Button onClick={() => signIn()}>Sign in</Button>
    </div>
  )
}
```

---

## 🎨 Material-UI (MUI)

### 1. Configuração com Tema

```typescript
// theme/rbac-theme.ts
import { createTheme } from "@mui/material/styles"

export const rbacTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  components: {
    // Componentes RBAC customizados
    MuiButton: {
      variants: [
        {
          props: { variant: "rbac-protected" },
          style: {
            backgroundColor: "#f5f5f5",
            "&:disabled": {
              backgroundColor: "#e0e0e0",
              color: "#9e9e9e",
            },
          },
        },
      ],
    },
  },
})
```

### 2. Componentes Protegidos

```typescript
// components/rbac-button.tsx
import { usePode } from '@anpdgovbr/rbac-react'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'
import type { Action, Resource } from '@anpdgovbr/rbac-core'

interface RBACButtonProps extends Omit<ButtonProps, 'disabled'> {
  action: Action
  resource: Resource
  fallbackDisabled?: boolean
}

export default function RBACButton({
  action,
  resource,
  fallbackDisabled = true,
  children,
  ...buttonProps
}: RBACButtonProps) {
  const { pode, loading } = usePode()

  const canPerform = pode(action, resource)
  const isDisabled = loading || (!canPerform && fallbackDisabled)

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
    >
      {children}
    </Button>
  )
}

// Uso
<RBACButton
  action="Criar"
  resource="Usuario"
  variant="contained"
  color="primary"
>
  Criar Usuário
</RBACButton>
```

### 3. Menu Condicional

```typescript
// components/rbac-menu.tsx
import { usePode } from '@anpdgovbr/rbac-react'
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

interface MenuItem {
  label: string
  icon: React.ReactNode
  action: string
  resource: string
  path: string
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    action: 'Exibir',
    resource: 'Dashboard',
    path: '/dashboard'
  },
  {
    label: 'Usuários',
    icon: <PeopleIcon />,
    action: 'Exibir',
    resource: 'Usuarios',
    path: '/users'
  },
  {
    label: 'Administração',
    icon: <AdminPanelSettingsIcon />,
    action: 'Acessar',
    resource: 'PainelAdmin',
    path: '/admin'
  }
]

interface RBACMenuProps {
  open: boolean
  onNavigate: (path: string) => void
}

export default function RBACMenu({ open, onNavigate }: RBACMenuProps) {
  const { pode } = usePode()

  const visibleItems = menuItems.filter(item =>
    pode(item.action, item.resource)
  )

  return (
    <Drawer open={open} variant="persistent">
      <List>
        {visibleItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => onNavigate(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}
```

---

## 🧪 Testing

### 1. Mock Providers

```typescript
// __tests__/utils/rbac-mocks.ts
import type { PermissionsProvider } from "@anpdgovbr/rbac-provider"
import type { PermissionsMap } from "@anpdgovbr/rbac-core"

export function createMockProvider(permissions: PermissionsMap): PermissionsProvider {
  return {
    async getUserPermissions() {
      return permissions
    },
  }
}

export const adminPermissions: PermissionsMap = {
  "Exibir:Dashboard": true,
  "Criar:Usuario": true,
  "Editar:Usuario": true,
  "Excluir:Usuario": true,
  "Administrar:Sistema": true,
}

export const userPermissions: PermissionsMap = {
  "Exibir:Dashboard": true,
  "Criar:Usuario": false,
  "Editar:Usuario": false,
  "Excluir:Usuario": false,
}
```

### 2. Component Testing

```typescript
// __tests__/components/dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { PermissionsProvider } from '@anpdgovbr/rbac-react'
import Dashboard from '@/components/dashboard'
import { adminPermissions, userPermissions } from '../utils/rbac-mocks'

const renderWithPermissions = (permissions: any) => {
  return render(
    <PermissionsProvider
      initialData={permissions}
      fetcher={async () => permissions}
    >
      <Dashboard />
    </PermissionsProvider>
  )
}

describe('Dashboard', () => {
  it('shows admin features for admin users', () => {
    renderWithPermissions(adminPermissions)

    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByText('Criar Usuário')).toBeInTheDocument()
    expect(screen.getByText('Administração')).toBeInTheDocument()
  })

  it('hides admin features for regular users', () => {
    renderWithPermissions(userPermissions)

    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.queryByText('Criar Usuário')).not.toBeInTheDocument()
    expect(screen.queryByText('Administração')).not.toBeInTheDocument()
  })
})
```

### 3. API Testing

```typescript
// __tests__/api/users.test.ts
import { GET, POST } from "@/app/api/users/route"
import { NextRequest } from "next/server"
import {
  createMockProvider,
  adminPermissions,
  userPermissions,
} from "../utils/rbac-mocks"

// Mock the provider
jest.mock("@/lib/rbac-config", () => ({
  cachedProvider: createMockProvider(adminPermissions),
}))

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({ user: { email: "admin@anpd.gov.br" } })
  ),
}))

describe("/api/users", () => {
  it("allows admin to list users", async () => {
    const request = new NextRequest("http://localhost:3000/api/users")
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it("denies regular user to create users", async () => {
    // Switch to user permissions
    jest
      .mocked(require("@/lib/rbac-config").cachedProvider)
      .getUserPermissions.mockResolvedValue(userPermissions)

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Test User" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})
```

---

## 📊 Monitoring

### 1. Metrics Collection

```typescript
// lib/rbac-metrics.ts
import { withMetrics } from "@anpdgovbr/rbac-provider"

class MetricsCollector {
  private metrics = new Map<string, number>()

  increment(key: string, value = 1) {
    this.metrics.set(key, (this.metrics.get(key) || 0) + value)
  }

  histogram(key: string, value: number) {
    // Implementar histograma conforme sua solução de métricas
    console.log(`${key}: ${value}ms`)
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }
}

export const metricsCollector = new MetricsCollector()

export const monitoredProvider = withMetrics(cachedProvider, {
  onPermissionCheck: (identity, action, resource, result, duration) => {
    metricsCollector.histogram("rbac.check.duration", duration)
    metricsCollector.increment(`rbac.check.result.${result}`)
    metricsCollector.increment("rbac.checks.total")

    if (duration > 100) {
      metricsCollector.increment("rbac.checks.slow")
      console.warn(
        `Slow permission check: ${action}:${resource} for ${identity} took ${duration}ms`
      )
    }
  },

  onCacheHit: (identity) => {
    metricsCollector.increment("rbac.cache.hits")
  },

  onCacheMiss: (identity) => {
    metricsCollector.increment("rbac.cache.misses")
  },
})
```

### 2. Health Check Endpoint

```typescript
// app/api/health/rbac/route.ts
import { NextResponse } from "next/server"
import { cachedProvider } from "@/lib/rbac-config"
import { metricsCollector } from "@/lib/rbac-metrics"

export async function GET() {
  try {
    // Test provider connectivity
    const testEmail = "health-check@test.com"
    const start = Date.now()

    try {
      await cachedProvider.getUserPermissions(testEmail)
    } catch (error) {
      // Expected for non-existent user
    }

    const duration = Date.now() - start
    const metrics = metricsCollector.getMetrics()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      provider: {
        responseTime: `${duration}ms`,
        healthy: duration < 1000,
      },
      cache: {
        hitRatio:
          metrics["rbac.cache.hits"] /
            (metrics["rbac.cache.hits"] + metrics["rbac.cache.misses"]) || 0,
        totalChecks: metrics["rbac.checks.total"] || 0,
        slowChecks: metrics["rbac.checks.slow"] || 0,
      },
      metrics,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
```

### 3. Dashboard de Métricas

```typescript
// components/rbac-metrics-dashboard.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Grid } from '@mui/material'

interface Metrics {
  provider: {
    responseTime: string
    healthy: boolean
  }
  cache: {
    hitRatio: number
    totalChecks: number
    slowChecks: number
  }
}

export default function RBACMetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/health/rbac')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch RBAC metrics:', error)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // 30s

    return () => clearInterval(interval)
  }, [])

  if (!metrics) return <div>Loading metrics...</div>

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Provider Health
            </Typography>
            <Typography variant="h5" component="div">
              {metrics.provider.healthy ? '✅ Healthy' : '❌ Unhealthy'}
            </Typography>
            <Typography color="textSecondary">
              Response: {metrics.provider.responseTime}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Cache Hit Ratio
            </Typography>
            <Typography variant="h5" component="div">
              {(metrics.cache.hitRatio * 100).toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Checks
            </Typography>
            <Typography variant="h5" component="div">
              {metrics.cache.totalChecks.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Slow Checks
            </Typography>
            <Typography variant="h5" component="div" color={metrics.cache.slowChecks > 0 ? 'error' : 'inherit'}>
              {metrics.cache.slowChecks}
            </Typography>
            <Typography color="textSecondary">
              >100ms
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
```

---

## 🔗 Links Úteis

- 📚 **[Documentação Principal](./README.md)**
- 🔌 **[APIs Completas](./apis.md)**
- 🏗️ **[Arquitetura](./architecture.md)**
- ❓ **[FAQ](./faq.md)**
- 📊 **[Guia NCU](./NCU_GUIDE.md)**

---

**Status**: Produção Beta | **Última Atualização**: Setembro 2025  
**Mantido por**: Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)

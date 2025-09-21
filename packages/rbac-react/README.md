# @anpdgovbr/rbac-react

[![npm version](https://img.shields.io/npm/v/@anpdgovbr/rbac-react.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Hooks e HOCs React para RBAC** — Integração client-side do sistema de autorização ANPD.

## ✨ Características

- ⚛️ **React 18+** — Hooks modernos e Server Components friendly
- 🔄 **SWR Integration** — Cache inteligente com revalidação automática
- 🎭 **HOC Pattern** — Proteção declarativa de componentes
- 🎯 **Type Safety** — Totalmente tipado com TypeScript
- 🚀 **Performance** — Otimizado para re-renders mínimos

## 📦 Instalação

```bash
npm install @anpdgovbr/rbac-react@beta
```

**Peer Dependencies:**

```bash
npm install react@^18 swr@^2
```

## 🎯 Uso Básico

### 1. Provider de Contexto

Configure o provider no nível raiz da aplicação:

```tsx
import { PermissionsProvider } from "@anpdgovbr/rbac-react"

function App() {
  // Permissões podem vir do SSR, API, ou outros sources
  const permissionsMap = useServerPermissions() // seu hook customizado

  return (
    <PermissionsProvider value={permissionsMap}>
      <Dashboard />
    </PermissionsProvider>
  )
}
```

### 2. Hook de Permissões

```tsx
import { usePermissions } from "@anpdgovbr/rbac-react"

function Dashboard() {
  const { permissoes, loading, error } = usePermissions({
    endpoint: "/api/permissoes", // opcional
    initial: preloadedPermissions, // opcional
  })

  if (loading) return <Loading />
  if (error) return <Error />

  return <div>Dashboard com permissões: {JSON.stringify(permissoes)}</div>
}
```

### 3. Hook de Verificação

```tsx
import { usePode } from "@anpdgovbr/rbac-react"

function ReportsPanel() {
  const { pode, loading } = usePode()

  if (loading) return <Skeleton />

  return (
    <div>
      {pode("Exibir", "Relatorios") && <ReportsViewer />}
      {pode("Criar", "Relatorios") && <CreateReportButton />}
      {pode("Editar", "Relatorios") && <EditReportsPanel />}
    </div>
  )
}
```

### 4. HOC de Proteção

```tsx
import { withPermissao } from "@anpdgovbr/rbac-react"

// Componente original
function AdminPanel() {
  return (
    <div>
      <h1>Painel Administrativo</h1>
      <UserManagement />
      <SystemSettings />
    </div>
  )
}

// Versão protegida
export default withPermissao(
  AdminPanel,
  "Acessar",
  "PainelAdmin",
  { redirect: true } // ou false para mostrar "Acesso negado"
)
```

## 🔧 API Completa

### `PermissionsProvider`

Provider de contexto para injetar permissões pré-resolvidas.

```tsx
interface PermissionsProviderProps {
  children: React.ReactNode
  value: PermissionsMap
}
```

**Uso típico com SSR:**

```tsx
// pages/_app.tsx ou app/layout.tsx
export default function RootLayout({
  children,
  permissions,
}: {
  children: React.ReactNode
  permissions: PermissionsMap
}) {
  return <PermissionsProvider value={permissions}>{children}</PermissionsProvider>
}
```

### `usePermissions(options?)`

Hook para obter permissões via contexto ou endpoint.

```tsx
interface PermissionsClientOptions {
  endpoint?: string // padrão: "/api/permissoes"
  fetcher?: (url: string) => Promise<unknown>
  initial?: PermissionsMap
}

interface UsePermissionsReturn {
  permissoes: PermissionsMap
  loading: boolean
  error?: Error
}
```

**Estratégias de carregamento:**

1. **Contexto** — Se `PermissionsProvider` estiver presente, usa o valor do contexto
2. **Initial** — Se `initial` for fornecido, usa como fallback
3. **Endpoint** — Faz fetch via SWR se contexto não estiver disponível

### `usePode()`

Hook para verificação reativa de permissões.

```tsx
interface UsePodeReturn {
  pode: (acao: Action, recurso: Resource) => boolean
  loading: boolean
}
```

**Exemplo avançado:**

```tsx
function ConditionalUI() {
  const { pode, loading } = usePode()

  const actions = useMemo(
    () => [
      { key: "view", show: pode("Exibir", "Docs"), label: "Ver Documentos" },
      { key: "edit", show: pode("Editar", "Docs"), label: "Editar Documentos" },
      { key: "delete", show: pode("Excluir", "Docs"), label: "Excluir Documentos" },
    ],
    [pode]
  )

  if (loading) return <ActionsLoading />

  return (
    <ActionsList>
      {actions
        .filter((action) => action.show)
        .map((action) => (
          <ActionButton key={action.key}>{action.label}</ActionButton>
        ))}
    </ActionsList>
  )
}
```

### `withPermissao(Component, acao, recurso, options?)`

HOC para proteção declarativa de componentes.

```tsx
interface WithPermissaoOptions {
  redirect?: boolean // padrão: true
}

function withPermissao<TProps extends object>(
  Component: React.ComponentType<TProps>,
  acao: Action,
  recurso: Resource,
  options?: WithPermissaoOptions
): React.FC<TProps>
```

**Comportamentos:**

- `redirect: true` — Retorna `null` (não renderiza nada)
- `redirect: false` — Mostra mensagem "Acesso negado"
- Durante loading — Retorna `null`

> Nota importante sobre uso em páginas (Next App Router):
>
> `withPermissao` é um HOC client-side pensado para proteger componentes e melhorar a UX.
> Ele não executa checagem server-side nem faz redirects no servidor. Se usado diretamente como export default de uma `page.tsx` (client component), pode ocorrer mismatch/hydration quando o servidor renderiza conteúdo diferente do cliente.
>
> Recomendação: para proteger páginas inteiras utilize o helper server-side `checkPermission` do pacote `@anpdgovbr/rbac-next` (veja o README do `rbac-next`). O padrão é chamar `checkPermission` em um Server Component e, em caso de sucesso, renderizar um componente cliente protegido (carregado dinamicamente).

---

ℹ️ Desenvolvimento local com submódulos

Durante o desenvolvimento local com submódulos, este pacote pode depender de versões locais dos outros pacotes `rbac-*` (veja `__local_dev_note__` em `package.json`). Há também `TODO: (TEMP)` em alguns arquivos para facilitar testes com mocks. Antes de publicar, reverta `file:` para as dependências publicadas e remova os fallbacks temporários.

## 🧪 Padrões de Uso

### Proteção Multi-nível

```tsx
// Layout protegido
const AdminLayout = withPermissao(BaseLayout, "Acessar", "AreaAdmin")

// Seções específicas
const UserManagement = withPermissao(UsersList, "Gerenciar", "Usuarios")

const SystemSettings = withPermissao(SettingsPanel, "Configurar", "Sistema")
```

### Composição com Outros Hooks

```tsx
function useAdminPermissions() {
  const { pode } = usePode()

  return useMemo(
    () => ({
      canManageUsers: pode("Gerenciar", "Usuarios"),
      canViewReports: pode("Exibir", "Relatorios"),
      canConfigureSystem: pode("Configurar", "Sistema"),
    }),
    [pode]
  )
}
```

### Loading States Customizados

```tsx
function ProtectedComponent() {
  const { permissoes, loading } = usePermissions()

  if (loading) {
    return <CustomSkeleton />
  }

  // Resto do componente...
}
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
- ⚛️ [Exemplos React](../../examples/react/)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Agência Nacional de Proteção de Dados)

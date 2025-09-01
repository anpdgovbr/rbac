# APIs Públicas — Pacotes RBAC (@anpdgovbr)

Status: em progresso (assinaturas estabilizadas; podem ter ajustes menores)

## `@anpdgovbr/rbac-core`
Tipos genéricos (`Action`, `Resource` como `string`), `PermissionsMap`, `pode`, `hasAny`, `toPermissionsMap` e `toFlatKeyMap` (compat opcional).

## `@anpdgovbr/rbac-provider`
Interfaces `PermissionsProvider`, `IdentityResolver`, decorator `withTTLCache(provider, ttlMs)`.

## `@anpdgovbr/rbac-prisma`
`createPrismaPermissionsProvider({ prisma, tables?, identityField? })`, `getPerfisHerdadosNomes(...)`, `getPermissoesPorPerfil(...)`.

## `@anpdgovbr/rbac-next`
`withApi(handler, { provider, getIdentity, permissao?, tabela?, acao?, audit? })`, `withApiForId` equivalente.

## `@anpdgovbr/rbac-react`
`PermissionsProvider`, `usePermissions`, `usePode`, `withPermissao`.


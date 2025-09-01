# Arquitetura de Permissionamento (RBAC) — Proposta de Extração (opt-in)

Status: em progresso

- Realizado: esqueleto monorepo `rbac/` com pacotes core/provider/prisma/next/react.
- Em andamento: alinhamento de escopo `@anpdgovbr/*` e integração incremental.
- A fazer: publicar novo repo `anpdgovbr/rbac` e CI.

## Objetivos

- Unificar o modelo de permissões por par `{acao, recurso}`.
- Reuso em múltiplos sistemas (Next.js e além).
- Evitar divergência entre UI e servidor.
- Adapters finos (Prisma, NextAuth) sem acoplar o core.

## Monorepo (@anpdgovbr)

- `@anpdgovbr/rbac-core`: tipos genéricos, `PermissionsMap`, `pode`, `hasAny`, conversores.
- `@anpdgovbr/rbac-provider`: contratos `PermissionsProvider`, `IdentityResolver`, cache TTL decorator.
- `@anpdgovbr/rbac-prisma`: provider Prisma (herança de perfis, união por grant verdadeiro).
- `@anpdgovbr/rbac-next`: `withApi`/`withApiForId` (injeção provider/identity, auditoria plugável).
- `@anpdgovbr/rbac-react`: hooks/HOC e provider de permissões para UX.
- (futuro) `@anpdgovbr/rbac-admin`: UI de administração de perfis/permissões.

Motivo monorepo: evolução coordenada entre pacotes, publicação independente.

## Fluxos

Servidor (autorização forte) e Cliente (UX) conforme descrito; cache TTL com invalidade global por alteração administrativa.

## Princípios de opt-in e independência

- Core desacoplado: `Action`/`Resource` são `string` e não dependem de enums de domínio.
- Adapters opcionais: `prisma`, `next`, `react` são pacotes separados; usar é opcional.
- Provedores e identidade são injetáveis; não há dependência direta de NextAuth.

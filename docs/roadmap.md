# Roadmap e Riscos (RBAC)

Status: atualizado (Done / Doing / Next)

Done
- Monorepo esqueleto com pacotes: core, provider, prisma, next, react.
- Adapter Next (`withApi`) e rota piloto (`GET /api/perfis`).
- Provider Prisma com herança e agregação (skeleton).

Doing
- Consolidar assinaturas públicas nos pacotes e TSDoc.
- Consolidar assinaturas públicas nos pacotes e TSDoc.
- Testes unitários mínimos (core/provider/prisma/next) — esqueleto adicionado.
- Exemplos de uso (API/React) em `examples/` — adicionados.

Next
- Evoluir `@anpdgovbr/rbac-admin` (UI administrativa) a partir do esqueleto.
- Adicionar exemplos de auditoria plugável no `withApi` (callback `audit`).
- Completar guia de migração com checklists por framework.
- Publicação por pacote (npm) e versionamento semântico.
- Iniciar `@anpdgovbr/rbac-admin` (UI administrativa) como pacote futuro.
- Adicionar auditoria plugável no `withApi` (callback `audit`).
- Preparar guia de migração completo com checklists por framework.

Riscos
- Quebra de imports; divergência enums (shared-types) vs strings; invalidação de cache; acoplamento a NextAuth (mitigado por `getIdentity`).

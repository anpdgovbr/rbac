# anpdgovbr/rbac — Monorepo de RBAC (opt-in)

Linguagem: TypeScript • Status: WIP • Licença: MIT

Monorepo de autorização por papéis (RBAC) desenhado para ser opcional e reutilizável em qualquer projeto. O core usa `string` para `acao`/`recurso` (sem dependência de enums) e os adapters (Prisma/Next/React) são plugáveis via injeção.

Pacotes
- `packages/rbac-core` — tipos e utilitários (`PermissionsMap`, `pode`, `hasAny`, conversores).
- `packages/rbac-provider` — contratos de provider/identidade + `withTTLCache`.
- `packages/rbac-prisma` — provider baseado em Prisma (herança e união por grant verdadeiro).
- `packages/rbac-next` — `withApi`/`withApiForId` com injeção de provider/identidade e auditoria opcional.
- `packages/rbac-react` — `PermissionsProvider`, `usePermissions`, `usePode`, `withPermissao`.
- `packages/rbac-admin` — esqueleto da UI administrativa (WIP; opcional).

Opt‑in e Independência
- Core desacoplado: nenhuma dependência de Next, Prisma ou enums de domínio.
- Adapters opcionais: use apenas os pacotes necessários ao seu projeto.
- Identidade injetável: compatível com NextAuth ou qualquer resolvedor customizado.

Uso Rápido (exemplos)
- Servidor (Next API):
  ```ts
  import { withApi } from '@anpdgovbr/rbac-next'
  export const GET = withApi(async () => Response.json([]), { provider, getIdentity, permissao: { acao: 'Exibir', recurso: 'Permissoes' } })
  ```
- Provider Prisma:
  ```ts
  import { createPrismaPermissionsProvider } from '@anpdgovbr/rbac-prisma'
  const provider = createPrismaPermissionsProvider({ prisma })
  ```
- Cliente (React):
  ```tsx
  import { withPermissao } from '@anpdgovbr/rbac-react'
  export default withPermissao(Component, 'Exibir', 'Permissoes')
  ```

Documentação
- Arquitetura: `docs/architecture.md`
- APIs públicas: `docs/apis.md`
- Guia de migração: `docs/migration-guide.md`
- Estratégia de dados: `docs/data-strategy.md`
- Padrões de desenvolvimento: `docs/dev-standards.md`
- Seeds e ambiente de dev: `docs/dev-seed.md`
- Roadmap: `docs/roadmap.md` (Done/Doing/Next)
- Checklist: `docs/CHECKLIST.md`

Status (Done / Doing / Next)
- Done: core, provider (contratos), prisma/next/react (skeleton), rota piloto (`GET /api/perfis`).
- Doing: consolidar APIs públicas e TSDoc; exemplos; setup de CI.
- Next: publicação por pacote; iniciar `@anpdgovbr/rbac-admin` (UI); ampliar testes.

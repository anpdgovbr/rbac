# Integração — Uso dos Pacotes (@anpdgovbr)

# Integração no Projeto Atual

Este guia resume como usar o esqueleto RBAC dentro deste repositório antes de destacá-lo.

1. Provider Prisma + Cache TTL

```ts
// exemplo: src/rbac-server.ts
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { withTTLCache } from "@anpdgovbr/rbac-provider"
import { prisma } from "@/lib/prisma"

export const rbacProvider = withTTLCache(
  createPrismaPermissionsProvider({ prisma }),
  60_000
)
```

2. Next Adapter nas rotas

```ts
import { withApi } from "@anpdgovbr/rbac-next"
import { rbacProvider } from "@/rbac-server"

const getIdentity = {
  resolve: async (req: Request) => ({ id: "user-id", email: "user@example.com" }),
}

export const GET = withApi(
  async ({ email }) => {
    return Response.json({ hello: email })
  },
  {
    provider: rbacProvider,
    getIdentity,
    permissao: { acao: "Exibir", recurso: "Processo" },
  }
)
```

3. Cliente React (UX)

```tsx
import { usePode } from "@anpdgovbr/rbac-react"

function Botao() {
  const { pode } = usePode()
  const enabled = pode("Editar", "Usuario")
  return <button disabled={!enabled}>Editar</button>
}
```

4. Invalidação de Cache

```ts
import { rbacProvider } from "@/rbac-server"
rbacProvider.invalidate() // após alterar permissões
```

Obs.: no novo repositório/pacotes publicados, os imports serão pelos nomes dos pacotes, por exemplo:
`@anpdgovbr/rbac-next`, `@anpdgovbr/rbac-prisma`, `@anpdgovbr/rbac-provider`.

Notas: veja também docs/apis.md e docs/migration-guide.md.

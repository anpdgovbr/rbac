# Exemplo — Next API com withApi

```ts
import { withApi } from "@anpdgovbr/rbac-next"
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { withTTLCache } from "@anpdgovbr/rbac-provider"

const rbacProvider = withTTLCache(createPrismaPermissionsProvider({ prisma }), 60_000)
const getIdentity = { resolve: async () => ({ id: "1", email: "user@anpd.gov.br" }) }

export const GET = withApi(async () => Response.json([]), {
  provider: rbacProvider,
  getIdentity,
  permissao: { acao: "Exibir", recurso: "Permissoes" },
})
```

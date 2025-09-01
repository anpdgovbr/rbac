## @anpdgovbr/rbac-next (beta)

Adapter Next.js para RBAC: `withApi` e `withApiForId` com injeção de provider e identidade.

- Instalação: `npm i @anpdgovbr/rbac-next@beta`
- Uso:
  ```ts
  import { withApi } from '@anpdgovbr/rbac-next'
  export const GET = withApi(async () => Response.json([]), { provider, getIdentity, permissao: { acao: 'Exibir', recurso: 'Permissoes' } })
  ```

Licença: MIT • Status: beta (0.1.x)

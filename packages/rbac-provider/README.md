## @anpdgovbr/rbac-provider (beta)

Contratos de provider/identidade e decorator `withTTLCache` para RBAC.

- Instalação: `npm i @anpdgovbr/rbac-provider@beta`
- Uso:
  ```ts
  import { withTTLCache, type PermissionsProvider } from '@anpdgovbr/rbac-provider'
  const base: PermissionsProvider = { getPermissionsByIdentity: async () => ({}), invalidate(){} }
  const provider = withTTLCache(base, 60_000)
  ```

Licença: MIT • Status: beta (0.1.x)

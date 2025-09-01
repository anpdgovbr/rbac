## @anpdgovbr/rbac-core (beta)

Tipos e utilitários centrais de RBAC. Desacoplado de enums; usa `string` para `acao` e `recurso`.

- Instalação: `npm i @anpdgovbr/rbac-core@beta`
- Uso:
  ```ts
  import { toPermissionsMap, pode, hasAny } from '@anpdgovbr/rbac-core'
  const perms = toPermissionsMap([{ acao: 'Exibir', recurso: 'Permissoes', permitido: true }])
  pode(perms, 'Exibir', 'Permissoes') // true
  ```
- API: ver `rbac/docs/apis.md`

Licença: MIT • Status: beta (0.1.x)

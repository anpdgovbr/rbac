## @anpdgovbr/rbac-react (beta)

Hooks e HOC React para RBAC no cliente (UX): `usePermissions`, `usePode`, `withPermissao`.

- Instalação: `npm i @anpdgovbr/rbac-react@beta`
- Uso:
  ```tsx
  import { withPermissao } from '@anpdgovbr/rbac-react'
  function Relatorios() { return <div>Relatórios</div> }
  export default withPermissao(Relatorios, 'Exibir', 'Relatorios')
  ```

Licença: MIT • Status: beta (0.1.x)
